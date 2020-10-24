import { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

import { FocalTracker } from "src/components/hooks/return-focus";
import { continueDialogue } from "src/redux/actions/dialogue";

import "./dialogue.less";



export function DialogueOverlay ({
  dialogueInProgress,
  currentTextLines,
  options,
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


  const [currentLine, setCurrentLine] = useState(0);

  // bind the key handler to the appropreate key once per refresh
  useEffect(() => {
    keyHandlerRef.current = key => {
      if (key !== 'e') {
        return;
      }
      if (currentTextLines) {
        if (currentLine + 1 < currentTextLines.length) {
          setCurrentLine(n => n + 1);
          return;
        }
      }
      setCurrentLine(0);
      dispatch(continueDialogue(key));
    };
  });

  let displayLine = currentTextLines && currentTextLines[currentLine];

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
          {displayLine}
          {options && JSON.stringify(options, 0, 2)}
        </div>
      </div>
    </div>
  );
}

function mapStateToProps(state) {
  const { dialogue: dialogueState } = state;
  let currentTextLines = null;
  let dialogueInProgress = false;
  let options = null;
  if (dialogueState.dialogue) {
    const { dialogue, currentState } = dialogueState;
    dialogueInProgress = true;
    const currentDialogueState = dialogue[currentState] || {};
    currentTextLines = currentDialogueState.text;
    options = currentDialogueState.options;
  }
  return {
    dialogueInProgress,
    currentTextLines,
    options
  }
}

export default connect(mapStateToProps)(DialogueOverlay);
