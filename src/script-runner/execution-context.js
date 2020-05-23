class RunningScript {
  constructor({
    scriptName,
    scriptRunner
  }) {
    this.scriptName = scriptName;
    this.scriptRunner = scriptRunner;
    this.executionSpeed = 0.5,
    this.running = true,
    this.currentLine = null,
    this.transpileError = null,
    this.runtimeError = null
  }
}

const RESERVED_SCRIPT_NAMES = {
  fire: 1
};

class ScriptExecutionContext {
  constructor(engine, boundToEntity) {
    this.engine = engine;
    this.boundToEntity = boundToEntity;

    this.runningScripts = [];
    this.runningScriptsById = {};
  }
  /**
   * Async initializer
   */
  async _init() {

  }
  /**
   * Method to run on each frame of the game
   */
  onFrame() {

  }
  /**
   * Adds a script to the registry
   */
  async registerScript(scriptName, scriptSrc) {

  }
  /**
   * Resolves a script by name - used to allow scripts to require other scripts
   */
  resolveScript(scriptName) {

  }
  /**
   * Runs a script with a given name
   */
  async runScript(scripSrc) {

  }
}
