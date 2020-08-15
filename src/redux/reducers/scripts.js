import shortid from "shortid";

import {
  SET_FOCUSED_SCRIPT,
  UPDATE_SCRIPT_STATES,
  LOG_TO_CONSOLE,

  ADD_SCRIPT_TO_LIBRARY,
  REMOVE_SCRIPT_FROM_LIBRARY
} from "../constants/scripts";

// default global state
const DEFAULT_STATE = {
  focusedScriptId: null,
  activeScripts: {},
  scriptLibrary: [],
  outputLines: [],
  maxOutputLines : 256
};

// default state for an active script
const DEFAULT_SCRIPT_STATE = {
  compiling: false,
  running: false,
  currentLine: null,
  runTimeError: null,
  compileTimeError: null,
  terminatedSuccessfully: false
};

export default function scriptsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case SET_FOCUSED_SCRIPT:
      return {
        ...state,
        focusedScriptId: action.focusedScriptId,
        compileTimeError: null
      };
    case UPDATE_SCRIPT_STATES: {
      const activeScripts = {};
      const focusedScriptId = action.focusedScriptId !== null ?
        action.focusedScriptId :
        state.focusedScriptId;
      if (state.activeScripts[focusedScriptId]) {
        activeScripts[focusedScriptId] = state.activeScripts[focusedScriptId];
      }
      Object.assign(activeScripts, action.states);
      return {
        ...state,
        focusedScriptId,
        activeScripts
      };
    }
    case LOG_TO_CONSOLE: {
      let outputLines = [...state.outputLines];
      outputLines.push(action.line);
      while (outputLines.length > state.maxOutputLines) {
        outputLines.shift();
      }
      return {
        ...state,
        outputLines
      };
    }
    case ADD_SCRIPT_TO_LIBRARY: {
      const { id, scriptName, scriptContents } = action;
      const script = {
        id,
        scriptName,
        scriptContents
      };
      return {
        ...state,
        scriptLibrary: state.scriptLibrary.concat([script])
      };
    }
    case REMOVE_SCRIPT_FROM_LIBRARY: {
      const { scriptId } = action;
      return {
        ...state,
        scriptLibrary: state.scriptLibrary.filter(s => s.id !== scriptId)
      };
    }
    default:
      break;
  }
  return state;
}
