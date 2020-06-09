import { useState } from "react";
import shortid from "shortid";

import {
  setFocusedScript,
  updateScriptStates,
} from "src/redux/actions/scripts";
import {
  setPlayerMana
} from "src/redux/actions/status";

import ScriptRunner from "./index";

// constants for RunningScript to return
const SCRIPT_NOT_RUNNING = false;
const SCRIPT_WAITING_TO_EXECUTE = false;
const SCRIPT_RUNNING = "SCRIPT_RUNNING";
const SCRIPT_FINISHED = "SCRIPT_FINISHED";
const SCRIPT_ERRORED_OUT = "SCRIPT_ERRORED_OUT";

export class RunningScript {
  constructor({
    engine,
    scriptName,
    scriptRunner,
    runningEntity,
    executionSpeed
  }) {
    this.engine = engine;
    this.id = shortid(),
    this.scriptName = scriptName;
    this.scriptContents = scriptRunner.sourceScript;
    this.scriptRunner = scriptRunner;
    this.runningEntity = runningEntity; // unused?
    this.executionSpeed = executionSpeed || 0.02;
    this.executionTimeDelta = 0;
    this.transpiling = false;
    this.running = false;
    this.paused = false;
    this.finished = false;
    this.currentLine = null;
    this.transpileError = null;
    this.runtimeError = null;
  }
  static withTranspileError({
    scriptName,
    scriptRunner,
    transpileError
  }) {
    const rs = new RunningScript({
      scriptName,
      scriptRunner
    });
    rs.running = false;
    rs.transpileError = transpileError;
    return rs;
  }
  /**
   * If currently running, perform operations at timeDelta * executionSpeed
   */
  _continueRunning(timeDelta, singleLine) {
    if (!this.running) {
      return SCRIPT_NOT_RUNNING;
    }
    if (this.paused && !singleLine) {
      if (this.scriptRunner.hasCompletedExecution()) {
        this.running = false;
        this.finished = true;
        this.scriptRunner.cleanup();
        return SCRIPT_FINISHED;
      }
      return SCRIPT_WAITING_TO_EXECUTE;
    }
    this.executionTimeDelta += timeDelta * this.executionSpeed;
    if (singleLine) {
      this.executionTimeDelta = 1;
    }
    const engine = this.engine;
    let anythingHappened = SCRIPT_WAITING_TO_EXECUTE;
    try {
      while (this.executionTimeDelta >= 1) {
        this.executionTimeDelta += -1;
        let start = null;
        let exCap = 0;
        while (
          !start &&
          this.scriptRunner.hasNextStep() &&
          exCap++ < 1000
        ) {
          anythingHappened = SCRIPT_RUNNING;
          this.scriptRunner.doCurrentLine();
          const exSection = this.scriptRunner.getExecutingSection();
          [start] = exSection;
        }
        this.currentLine = this.scriptRunner.getExecutingLine();
      }
    }
    catch (ex) {
      // ignore illegal return statements - they come from a broken queueCall
      // implementation that has issues with multiple queueCalls, which totally
      // breaks the timeout implementation
      if (
        ex.name === "SyntaxError" &&
        ex.message === "Illegal return statement"
      ) {
        return false;
      }
      console.error(ex);
      this.runtimeError = ex;
      this.running = false;
      this.scriptRunner.cleanup();
      return SCRIPT_ERRORED_OUT;
    }

    if (this.scriptRunner.hasCompletedExecution()) {
      this.running = false;
      this.finished = true;
      this.scriptRunner.cleanup();
      return SCRIPT_FINISHED;
    }

    return anythingHappened;
  }
}

// list of reserved script names that can't be used
const RESERVED_SCRIPT_NAMES = {
  fire: 1
};

export class ScriptExecutionContext {
  constructor(engine) {
    this.engine = engine;
    this.runningScripts = [];
  }
  /**
   * Method to run on each frame of the game
   */
  onFrame(timeDelta) {
    const engine = this.engine;
    if (!engine.running) {
      return;
    }
    let anythingHappened = false;
    this.runningScripts.forEach(s => {
      const didAnything = s._continueRunning(timeDelta);
      if (didAnything) {

        // restock mana on successful script run for now
        if (didAnything === SCRIPT_FINISHED) {
          engine.dispatch(setPlayerMana(1000));
        }

        anythingHappened = true;
      }
    });
    if (anythingHappened) {
      engine.dispatch(updateScriptStates(this));
    }
  }
  /**
   * Runs a script with a given name
   */
  async runScript(scriptSrc, runningEntity, executionSpeed) {
    this._flushInactiveScripts();

    const engine = this.engine;
    const scriptName = `scr-${shortid()}`;

    // create the runner
    const scriptRunner = new ScriptRunner(
      scriptSrc,
      engine,
      runningEntity
    );

    // create the execution state manager
    const exState = new RunningScript({
      scriptName,
      scriptRunner,
      runningEntity,
      executionSpeed
    });

    exState.transpiling = true;
    exState.running = false;

    // apply execution state and dispatch - this represents the fact that we're
    // transpiling the script
    this.runningScripts.push(exState);
    engine.dispatch(updateScriptStates(this, exState.id));

    // wait for the compilation to finish
    try {
      await scriptRunner.readyPromise;
    }
    catch (err) {
      // todo handle gracefully
      console.error(err);

      // not a compile time error
      if (!err.loc) {
        return;
      }

      // update the execution state with the error, dispatch the results
      exState.transpiling = false;
      exState.transpileError = err;
      engine.dispatch(updateScriptStates(this, exState.id));
      throw err;
    }

    // we're done compiling!
    exState.transpiling = false;
    exState.running = true;

    // update script states in the engine
    engine.dispatch(updateScriptStates(this, exState.id));
    return exState;
  }
  pauseScript(scriptName) {
    const engine = this.engine;
    const paused = this.runningScripts.find(s => s.scriptName === scriptName);
    if (!paused) {
      return;
    }
    paused.paused = true;
    engine.dispatch(updateScriptStates(this));
  }
  resumeScript(scriptName) {
    const engine = this.engine;
    const paused = this.runningScripts.find(s => s.scriptName === scriptName);
    if (!paused) {
      return;
    }
    paused.paused = false;
    engine.dispatch(updateScriptStates(this));
  }
  stepScript(scriptName) {
    const engine = this.engine;
    const paused = this.runningScripts.find(s => s.scriptName === scriptName);
    if (!paused || !paused.paused) {
      return;
    }
    paused._continueRunning(0, true);
    engine.dispatch(updateScriptStates(this));
  }
  stopScript(scriptName) {
    const engine = this.engine;
    const stopped = this.runningScripts.find(s => s.scriptName === scriptName);
    stopped.running = false;
    stopped.scriptRunner.cleanup();
    this.runningScripts = this.runningScripts.filter(s => s => stopped);
    engine.dispatch(updateScriptStates(this));
    return stopped;
  }
  getRunningScripts() {
    return this.runningScripts;
  }
  _flushInactiveScripts() {
    this.runningScripts = this.runningScripts.filter(s => {
      if (s.finished) {
        return false;
      }
      if (s.runTimeError) {
        return false;
      }
      if (s.transpileError) {
        return false;
      }
      return true;
    });
  }
}
