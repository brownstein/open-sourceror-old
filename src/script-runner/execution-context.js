class ScriptExecutionContext {
  constructor(engine, boundToEntity, scriptSrc) {
    this.engine = engine;
    this.boundToEntity = boundToEntity;
    this.scriptSrc = scriptSrc;

    this.transpiledScript = null;
    this.transpilationMap = null;

    this.interpreter = null;
  }
  async _init() {
    
  }
  performFrameUpdates() {

  }
  runScript(scriptName) {

  }
}
