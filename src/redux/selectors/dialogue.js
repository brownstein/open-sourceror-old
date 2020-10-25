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
  let hasNextLine = false;
  let hasOptions = false;
  if (Array.isArray(currentDialogueDef.text)) {
    textLine = currentDialogueDef.text[currentLine];
    hasNextLine = currentLine + 1 < currentDialogueDef.text.length;
  }
  else {
    textLine = currentDialogueDef.text;
    hasNextLine = false;
  }
  hasOptions = !!options;
  return {
    textLine,
    hasNextLine,
    options,
    hasOptions
  };
};
