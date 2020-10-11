
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
        text: "I was chasing a fox.",
        next: "CHASING_FOX"
      },
      {
        text: "Yes.",
        next: "LOST"
      }
    ]
  },
  CHASING_FOX: {
    text: "I see."
  },
  LOST: {
    text: "I see."
  }
};
