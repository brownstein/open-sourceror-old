import {
  BEGIN_DIALOGUE,
  CONTINUE_DIALOGUE,
  END_DIALOGUE
} from "../constants/dialogue";

const INITIAL_STATE = {
  dialogue: null,
  currentState: null
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
        currentState: initialState
      };
    }
    case CONTINUE_DIALOGUE: {
      return {
        ...state,
        currentState: action.nextState
      };
    }
    case END_DIALOGUE: {
      return {
        ...state,
        dialogue: null,
        currentState: null
      };
    }
    default:
      return state;
  }
}
