import { useState } from "react";
import EventEmitter from "events";
import shortid from "shortid";

import {
  executionStarted,
  executionFinished,
  continuingExecution,
  compileTimeError,
  runtimeError,
  activeScriptChanged,
  activeScriptRun,

  setFocusedScript,
  updateScriptStates,
} from "src/redux/actions/scripts";

import ScriptRunner from "./index";

export class RunningScript {
  constructor({
    engine,
    scriptName,
    scriptRunner,
    targetEntity
  }) {
    this.engine = engine;
    this.id = shortid(),
    this.scriptName = scriptName;
    this.scriptRunner = scriptRunner;
    this.targetEntity = targetEntity;
    this.executionSpeed = 0.01,
    this.executionTimeDelta = 0,
    this.running = true,
    this.finished = false;
    this.currentLine = null,
    this.transpileError = null,
    this.runtimeError = null,
    this.runEmitter = new EventEmitter();
  }
  /**
   * If currently running, perform operations at timeDelta * executionSpeed
   */
  _continueRunning(timeDelta) {
    if (!this.running) {
      return false;
    }
    this.executionTimeDelta += timeDelta * this.executionSpeed;
    const engine = this.engine;
    let anythingHappened = false;
    try {
      while (this.executionTimeDelta > 1) {
        this.executionTimeDelta += -1;
        let start = null;
        let exCap = 0;
        while (
          !start &&
          this.scriptRunner.hasNextStep() &&
          exCap++ < 1000
        ) {
          anythingHappened = true;
          this.scriptRunner.doCurrentLine();
          const exSection = this.scriptRunner.getExecutingSection();
          [start] = exSection;
        }
        this.currentLine = this.scriptRunner.getExecutingLine();
      }
    }
    catch (ex) {
      console.error("script exception", ex);
      this.runtimeError = ex;
      this.running = false;
      this.runEmitter.emit("scriptRuntimeError", {
        runtimeError: ex,
        currentLine: this.currentLine
      });
      // engine.dispatch &&
      // engine.dispatch(runtimeError(ex));
      return true;
    }

    if (this.scriptRunner.hasCompletedExecution()) {
      this.running = false;
      this.finished = true;
      this.runEmitter.emit('terminated');
      // engine.dispatch &&
      // engine.dispatch(executionFinished(this.currentLine));
      return true;
    }

    this.runEmitter.emit("running", {
      currentLine: this.currentLine
    });
    // engine.dispatch &&
    // engine.dispatch(continuingExecution(this.currentLine));
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
    if (!this.engine.running) {
      return;
    }
    let anythingHappened = false;
    this.runningScripts.forEach(s => {
      const didAnything = s._continueRunning(timeDelta);
      if (didAnything) {
        anythingHappened = true;
      }
    });
    if (anythingHappened) {
      this.engine.dispatch &&
      this.engine.dispatch(updateScriptStates(this));
    }
  }
  /**
   * Runs a script with a given name
   */
  async runScript(scriptSrc, runningEntity) {
    this._flushInactiveScripts();

    const engine = this.engine;
    const scriptName = `scr-${shortid()}`;
    const scriptRunner = new ScriptRunner(
      scriptSrc,
      engine,
      runningEntity
    );
    try {
      await scriptRunner.readyPromise;
    }
    catch (err) {
      // todo handle gracefully
      console.error(err);
      engine.dispatch &&
      engine.dispatch(compileTimeError(err));
      throw err;
    }

    const exState = new RunningScript({
      engine,
      scriptName,
      scriptRunner,
      targetEntity: runningEntity
    });

    this.runningScripts.push(exState);

    // update script states in the engine
    engine.dispatch &&
    engine.dispatch(updateScriptStates(this, exState.id));

    return exState;
  }
  stopScript(scriptName) {
    const stopped = this.runningScripts.find(s => s.scriptName === scriptName);
    stopped.running = false;
    this.runningScripts = this.runningScripts.filter(s => s => stopped);
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
      if (s.compileTimeError) {
        return false;
      }
      return true;
    });
  }
}
