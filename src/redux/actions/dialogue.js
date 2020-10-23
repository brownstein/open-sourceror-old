import {
  BEGIN_DIALOGUE,
  CONTINUE_DIALOGUE,
  END_DIALOGUE
} from "../constants/dialogue";

export const beginDialogue = (dialogueDef) => ({
  type: BEGIN_DIALOGUE,
  dialogueDef
});

export const continueDialogue = (action) => {
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
      dispatch({
        type: CONTINUE_DIALOGUE,
        nextState: currentStateDef.next
      });
      return;
    }
    else {
      dispatch(endDialogue());
    }
  };
};

export const endDialogue = () => ({
  type: END_DIALOGUE
});
