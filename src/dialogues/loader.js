import tutorial1 from "./tutorial-1";

export function loadDialogue(dialogueName) {
  switch (dialogueName) {
    case "tutorial-1":
      return tutorial1;
    default:
      return null;
  }
};
