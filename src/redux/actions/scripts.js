import {
  // old action types
  EXECUTION_STARTED,
  EXECUTION_FINISHED,

  CONTINUING_EXECUTION,
  COMPILETIME_ERROR,
  RUNTIME_ERROR,

  ACTIVE_SCRIPT_CHANGED,
  ACTIVE_SCRIPT_RUN,

  // new action types
  SET_FOCUSED_SCRIPT,
  UPDATE_SCRIPT_STATES,
} from "../constants/scripts";

//////////////////////////////
// Initial revision actions //
//////////////////////////////
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

/////////////////////////////
// Second revision actions //
/////////////////////////////
export const setFocusedScript = (focusedScriptId) => ({
  type: SET_FOCUSED_SCRIPT,
  focusedScriptId
});

export function updateScriptStates(executionContext, focusedScriptId = null) {
  const states = {};
  executionContext.runningScripts.forEach(r => {
    const {
      scriptName,
      scriptContents,
      scriptRunner,
      running,
      finished,
      currentLine,
      transpileError,
      runtimeError
    } = r;
    states[r.id] = {
      scriptName,
      scriptContents,
      running,
      finished,
      currentLine,
      compileTimeError: transpileError,
      runTimeError: runtimeError
    };
  });
  return {
    type: UPDATE_SCRIPT_STATES,
    states,
    focusedScriptId
  };
}
