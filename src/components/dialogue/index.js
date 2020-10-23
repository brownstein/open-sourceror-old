import { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

import { endDialogue } from "src/redux/actions/dialogue";

import "./dialogue.less";

export function DialogueOverlay ({
  dialogueInProgress,
  currentTextLines,
  dispatch
}) {
  // set up key press handler for the lifetime of the component
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

  // bind the key handler to the appropreate key once per refresh
  useEffect(() => {
    keyHandlerRef.current = key => {
      dispatch(endDialogue());
    };
  });

  if (!dialogueInProgress) {
    return null;
  }
  return (
    <div className="dialogue-overlay">
      <div className="dialogue-box">
        <div className="dialogue-icon-container">
          <div className="dialogue-icon">
            ICON HERE
          </div>
        </div>
        <div className="dialogue-text">
          {JSON.stringify(currentTextLines, 0, 2)}
        </div>
      </div>
    </div>
  );
}

function mapStateToProps(state) {
  const { dialogue: dialogueState } = state;
  let currentTextLines = null;
  let dialogueInProgress = false;
  if (dialogueState.dialogue) {
    const { dialogue, currentState } = dialogueState;
    dialogueInProgress = true;
    const currentDialogueState = dialogue[currentState] || {};
    currentTextLines = currentDialogueState.text;
  }
  return {
    dialogueInProgress,
    currentTextLines
  }
}

export default connect(mapStateToProps)(DialogueOverlay);
