

class DialogueEngine {
  constructor(dialogueDef) {
    // start at the frist defined state
    if (dialogueDef["START"]) {
      this.state = "START";
    }
    else {
      this.state = Object.keys(dialogueDef)[0];
    }

    this.textLine = 0;
    this.currentTextLines = [];


  }
}
