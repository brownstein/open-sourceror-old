import {
  EXECUTION_STARTED,
  EXECUTION_FINISHED,

  CONTINUING_EXECUTION,
  COMPILETIME_ERROR,
  RUNTIME_ERROR,

  ACTIVE_SCRIPT_CHANGED,
  ACTIVE_SCRIPT_RUN
} from "../constants/scripts";

export const executionStarted = (currentLine = null) => ({
  type: EXECUTION_STARTED,
  currentLine
});

export const executionFinished = () => ({
  type: EXECUTION_FINISHED
});

export const continuingExecution = (currentLine) => ({
  type: CONTINUING_EXECUTION,
  currentLine
});

export const compileTimeError = (error) => ({
  type: COMPILETIME_ERROR,
  error
});

export const runtimeError = (error) => ({
  type: RUNTIME_ERROR,
  error
});

export const activeScriptChanged = (activeScript) => ({
  type: ACTIVE_SCRIPT_CHANGED,
  activeScript
});

export const activeScriptRun = () => ({
  type: ACTIVE_SCRIPT_RUN
});
