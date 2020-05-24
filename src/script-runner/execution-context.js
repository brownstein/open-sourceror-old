import { useState } from "react";
import EventEmitter from "events";
import shortid from "shortid";

import ScriptRunner from "./index";

export class RunningScript {
  constructor({
    scriptName,
    scriptRunner,
    targetEntity
  }) {
    this.id = shortid(),
    this.scriptName = scriptName;
    this.scriptRunner = scriptRunner;
    this.targetEntity = targetEntity;
    this.executionSpeed = 0.05,
    this.executionTimeDelta = 0,
    this.running = true,
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
      return;
    }
    this.executionTimeDelta += timeDelta * this.executionSpeed;
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
          this.scriptRunner.doCurrentLine();
          const exSection = this.scriptRunner.getExecutingSection();
          [start] = exSection;
        }
        this.currentLine = this.scriptRunner.getExecutingLine();
      }
    }
    catch (ex) {
      console.error(ex);
      this.runtimeError = ex;
      this.running = false;
      this.runEmitter.emit("error", {
        runtimeError: ex,
        currentLine: this.currentLine
      });
      return;
    }
    this.runEmitter.emit("running", {
      currentLine: this.currentLine
    });
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
    this.runningScripts.forEach(s => s._continueRunning(timeDelta));
  }
  /**
   * Runs a script with a given name
   */
  async runScript(scriptSrc, runningEntity) {
    const scriptName = `scr-${shortid()}`;
    const scriptRunner = new ScriptRunner(
      scriptSrc,
      this.engine,
      runningEntity
    );
    try {
      await scriptRunner.readyPromise;
    }
    catch (err) {
      // todo handle gracefully
      console.error(err);
      throw err;
    }

    const exState = new RunningScript({
      scriptName,
      scriptRunner,
      targetEntity: runningEntity
    });

    this.runningScripts.push(exState);
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
}
