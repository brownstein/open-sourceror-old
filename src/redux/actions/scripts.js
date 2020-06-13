import fs from "fs";

import {
  SET_FOCUSED_SCRIPT,
  UPDATE_SCRIPT_STATES,
  LOG_TO_CONSOLE,

  SET_SCRIPT_LIBRARY_ON_LOAD,

  ADD_SCRIPT_TO_LIBRARY,
  REMOVE_SCRIPT_FROM_LIBRARY,
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

export const consoleLog = (...content) => {
  const line = content.join(' ');
  return {
    type: LOG_TO_CONSOLE,
    line
  };
}

export async function loadScriptLibraryFromDisc() {
  return {
    type: SET_SCRIPT_LIBRARY_ON_LOAD
  };
}

export const setScriptLibraryOnLoad = () => ({
  type: SET_SCRIPT_LIBRARY_ON_LOAD
});

export const addScriptToLibrary = ({
  scriptName,
  scriptContents
}) => ({
  type: ADD_SCRIPT_TO_LIBRARY,
  scriptName,
  scriptContents
});

export const removeScriptFromLibrary = ({
  scriptName
}) => ({
  type: REMOVE_SCRIPT_FROM_LIBRARY,
  scriptName,
  scriptContents
});
