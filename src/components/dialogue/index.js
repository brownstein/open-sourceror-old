import { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

import { endDialogue } from "src/redux/actions/dialogue";

import "./dialogue.less";

export function DialogueOverlay ({
  dialogueInProgress,
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
          Lorem Ipsum Dolor Dolor Dolor Lorem Ipsum Dolor Dolor Dolor Lorem Ipsum Dolor Dolor Dolor Lorem Ipsum Dolor Dolor Dolor
        </div>
      </div>
    </div>
  );
}

function mapStateToProps(state) {
  const { dialogue } = state;
  return {
    dialogueInProgress: dialogue.dialogue
  }
}

export default connect(mapStateToProps)(DialogueOverlay);
