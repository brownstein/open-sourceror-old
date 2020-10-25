import { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

import { FocalTracker } from "src/components/hooks/return-focus";
import {
  continueDialogue,
  advanceDialogueLine
} from "src/redux/actions/dialogue";
import {
  presentDialogueDisplay
} from "src/redux/selectors/dialogue";

import "./dialogue.less";

/**
 * Shared functional keyboard handler hook
 */
export function useKeyboardHandler(handler) {
  const keyHandlerRef = useRef();
  useEffect(() => {
    function onKeyDown(e) {
      const { key } = e;
      keyHandlerRef.current(key);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    }
  }, []);
  useEffect(() => {
    keyHandlerRef.current = handler;
  });
}

export function DialogueOverlay ({
  dialogueInProgress,
  textLine,
  hasNextLine,
  hasOptions,
  options,
  dispatch
}) {
  useKeyboardHandler(key => {
    if (key !== 'e') {
      return;
    }
    if (hasNextLine) {
      return dispatch(advanceDialogueLine());
    }
    if (!options) {
      dispatch(continueDialogue());
    }
  });

  if (!dialogueInProgress) {
    return null;
  }
  return (
    <div className="dialogue-overlay">
      <FocalTracker/>
      <div className="dialogue-box">
        <div className="dialogue-icon-container">
          <div className="dialogue-icon">
            ICON HERE
          </div>
        </div>
        <div className="dialogue-main">
          { textLine }
          { options &&
            <DialogueOptions
              dispatch={dispatch}
              options={options}
            />}
        </div>
      </div>
    </div>
  );
}

function DialogueOptions({
  options,
  dispatch
}) {
  const [optionChoice, setOptionChoice] = useState(0);

  useKeyboardHandler(key => {
    if (key === "w") {
      return setOptionChoice(c => (c + options.length - 1) % options.length);
    }
    if (key === "s") {
      return setOptionChoice(c => (c + 1) % options.length);
    }
    if (key === "e") {
      return dispatch(continueDialogue(optionChoice));
    }
  });

  return (
    <div className="dialogue-options">
      { options.map((opt, i) => (
        <div key={i}>
          { optionChoice === i && ">" }
          { opt.text }
        </div>
      ))}
    </div>
  );
}

function mapStateToProps(state) {
  const dialogueDisplay = presentDialogueDisplay(state);
  console.log({ dialogueDisplay });
  if (!dialogueDisplay) {
    return {
      dialogueInProgress: false
    };
  }
  else {
    return {
      dialogueInProgress: true,
      ...dialogueDisplay
    };
  }
}

export default connect(mapStateToProps)(DialogueOverlay);
