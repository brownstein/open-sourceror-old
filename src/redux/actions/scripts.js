import {
  SET_FOCUSED_SCRIPT,
  UPDATE_SCRIPT_STATES,
} from "../constants/scripts";

/////////////////////////////
// Second revision actions //
/////////////////////////////

/**
 * Set the actively focused script
 */
export const setFocusedScript = (focusedScriptId) => ({
  type: SET_FOCUSED_SCRIPT,
  focusedScriptId
});

/**
 * Bulk dumper from script executor state into redux state -- we could do this
 * slightly more subtlely, but this is actually faster than maintaining
 * everything separately in Redux and doing incremental updates from a refresh
 * perspective.
 */
export function updateScriptStates(executionContext, focusedScriptId = null) {
  const states = {};
  executionContext.runningScripts.forEach(r => {
    const {
      scriptName,
      scriptContents,
      scriptRunner,
      running,
      finished,
      paused,
      currentLine,
      transpileError,
      runtimeError,
      transpiling
    } = r;
    states[r.id] = {
      scriptName,
      scriptContents,
      running,
      paused,
      finished,
      currentLine,
      compileTimeError: transpileError,
      runTimeError: runtimeError,
      compiling: transpiling
    };
  });
  return {
    type: UPDATE_SCRIPT_STATES,
    states,
    focusedScriptId
  };
}
