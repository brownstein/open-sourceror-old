
export default {
  START: {
    text: [
      "Hello?",
      "Who's there?"
    ],
    icon: "question",
    next: "DIALOGUE_START"
  },
  DIALOGUE_START: {
    text: [
      "You seem to have wandered far.",
      "Are you lost?"
    ],
    icon: "teacher",
    options: [
      {
        text: ["I was chasing a fox."],
        next: "CHASING_FOX"
      },
      {
        text: ["Yes."],
        next: "LOST"
      }
    ]
  },
  CHASING_FOX: {
    text: [
      "I don't see any foxes around, but never mind that",
      "you look like a noob in need to a tutorial"
    ],
    options: [
      {
        text: "Yes",
        next: "TUTORIAL"
      },
      {
        text: "Definitely",
        next: "TUTORIAL"
      }
    ]
  },
  LOST: {
    text: [
      "I see.",
      "Let's get you un-lost"
    ],
    next: "TUTORIAL"
  },
  TUTORIAL: {
    text: [
      "It's time you learned a little magic",
      "You see that console in the bottom half of your screen?",
      <span>Type "<b>console.log("Hello World");</b>" in there and hit run </span>
    ],
    next: "DONE"
  }
};
