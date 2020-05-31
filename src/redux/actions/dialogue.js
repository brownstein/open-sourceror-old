import {
  BEGIN_DIALOGUE,
  ADVANCE_THROUGH_DIALOGUE,
  END_DIALOGUE
} from "src/redux/constants/dialogue";

export const beginDialogue = (dialogueLines) => ({
  type: BEGIN_DIALOGUE,
  dialogueLines
});

export const advanceThroughDialogue = () => ({
  type: ADVANCE_THROUGH_DIALOGUE
});

export const endDialogue = () => ({
  type: END_DIALOGUE
});
