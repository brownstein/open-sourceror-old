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

// default global state
const DEFAULT_STATE = {
  focusedScriptId: null,
  activeScripts: {},

  // TODO: refactor all of this out
  activeScriptName: "",
  activeScriptContents: null,
  running: false,
  currentLine: null,
  runTimeError: null,
  compileTimeError: null,
  terminatedSuccessfully: false
};

// default state for an active script
const DEFAULT_SCRIPT_STATE = {
  running: false,
  currentLine: null,
  runTimeError: null,
  compileTimeError: null,
  terminatedSuccessfully: false
};

export default function scriptsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case EXECUTION_STARTED:
      return {
        ...state,
        running: true,
        currentLine: action.currentLine || 0,
        runTimeError: null,
        compileTimeError: null
      };
    case EXECUTION_FINISHED:
      return {
        ...state,
        running: false,
        currentLine: null,
        terminatedSuccessfully: true
      };
    case CONTINUING_EXECUTION:
      return {
        ...state,
        currentLine: action.currentLine
      };
    case COMPILETIME_ERROR:
      return {
        ...state,
        running: false,
        compileTimeError: action.error
      };
    case RUNTIME_ERROR:
      return {
        ...state,
        running: false,
        runTimeError: action.error
      };
    case ACTIVE_SCRIPT_CHANGED:
      return {
        ...state,
        activeScriptContents: action.activeScript
      };
    case ACTIVE_SCRIPT_RUN:
      return {
        ...state,
        running: true
      };

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
        compileTimeError: action.focusedScriptId ?
          false :
          state.compileTimeError,
        activeScripts
      };
    }
    default:
      break;
  }
  return state;
}
