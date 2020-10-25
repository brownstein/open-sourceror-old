import {
  BEGIN_DIALOGUE,
  ADVANCE_DIALOGUE_LINE,
  CONTINUE_DIALOGUE,
  END_DIALOGUE
} from "../constants/dialogue";

const INITIAL_STATE = {
  dialogue: null,
  currentState: null,
  currentLine: 0
};

export default function reduceDialogue(state = INITIAL_STATE, action) {
  switch (action.type) {
    case BEGIN_DIALOGUE: {
      const dialogue = action.dialogueDef;
      let initialState;
      if (dialogue["START"]) {
        initialState = "START";
      }
      else {
        initialState = Object.keys(dialogue)[0];
      }
      return {
        ...state,
        dialogue,
        currentState: initialState,
        currentLine: 0
      };
    }
    case ADVANCE_DIALOGUE_LINE: {
      return {
        ...state,
        currentLine: state.currentLine + 1
      };
    }
    case CONTINUE_DIALOGUE: {
      return {
        ...state,
        currentState: action.nextState,
        currentLine: 0
      };
    }
    case END_DIALOGUE: {
      return {
        ...state,
        dialogue: null,
        currentState: null,
        currentLine: 0
      };
    }
    default:
      return state;
  }
}
