import { continueDialogue } from "src/redux/actions/dialogue";


export function presentDialogueDisplay(state) {
  const { dialogue: dialogueState } = state;
  const {
    dialogue,
    currentState,
    currentLine
  } = dialogueState;

  if (!dialogue) {
    return null;
  }

  const currentDialogueDef = dialogue[currentState];
  const options = currentDialogueDef.options;
  let textLine;
  if (Array.isArray(currentDialogueDef.text)) {
    textLine = currentDialogueDef.text[currentLine];
  }
  else {
    textLine = currentDialogueDef.text;
  }
  if (textLine) {
    return {
      textLine
    };
  }
  else if (options) {
    return {
      options
    };
  }
  else {
    return {
      needsAdvance: true
    };
  }
};
