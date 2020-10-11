import fs from "fs";
import uuid from "uuid";

import {
  SET_FOCUSED_SCRIPT,
  UPDATE_SCRIPT_STATES,
  LOG_TO_CONSOLE,

  SET_SCRIPT_LIBRARY_ON_LOAD,

  ADD_SCRIPT_TO_LIBRARY,
  REMOVE_SCRIPT_FROM_LIBRARY,

  SAVE_SCRIPT,
  LOAD_SCRIPT
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
      scriptId,
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
      scriptId,
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

export const loadScriptFromItem = (item) => ({
  type: LOAD_SCRIPT,
  scriptId: item.itemData.scriptId,
  scriptName: item.itemData.scriptName,
  scriptContents: item.itemData.scriptContents
});

export const saveScript = ({
  scriptName,
  scriptContents
}) => ({
  id: uuid(),
  type: SAVE_SCRIPT,
  scriptName,
  scriptContents
});
