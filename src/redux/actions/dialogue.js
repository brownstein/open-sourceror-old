import {
  BEGIN_DIALOGUE,
  ADVANCE_DIALOGUE_LINE,
  CONTINUE_DIALOGUE,
  END_DIALOGUE
} from "../constants/dialogue";

export const beginDialogue = (dialogueDef) => ({
  type: BEGIN_DIALOGUE,
  dialogueDef
});

export const continueDialogue = (option) => {
  return (dispatch, getState) => {
    const { dialogue: dialogueState } = getState();
    const {
      dialogue,
      currentState
    } = dialogueState;

    if (!dialogue) {
      dispatch(endDialogue());
      return;
    }

    const currentStateDef = dialogue[currentState];
    if (currentStateDef.next) {
      if (currentStateDef.next === 'DONE') {
        return dispatch(endDialogue());
      }
      dispatch({
        type: CONTINUE_DIALOGUE,
        nextState: currentStateDef.next
      });
      return;
    }
    else if (currentStateDef.options) {
      dispatch({
        type: CONTINUE_DIALOGUE,
        nextState: currentStateDef.options[0].next
      });
    }
    else {
      dispatch(endDialogue());
    }
  };
};

export const endDialogue = () => ({
  type: END_DIALOGUE
});
