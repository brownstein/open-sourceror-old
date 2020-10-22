import {
  BEGIN_DIALOGUE,
  CONTINUE_DIALOGUE,
  END_DIALOGUE
} from "../constants/dialogue";

export const beginDialogue = (dialogueDef) => ({
  type: BEGIN_DIALOGUE,
  dialogueDef
});

export const continueDialogue = (nextState) => ({
  type: CONTINUE_DIALOGUE,
  nextStaste
});

export const endDialogue = () => ({
  type: END_DIALOGUE
});
