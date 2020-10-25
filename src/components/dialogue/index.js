import { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

import { FocalTracker } from "src/components/hooks/return-focus";
import { continueDialogue } from "src/redux/actions/dialogue";

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
  currentTextLines,
  options,
  dispatch
}) {
  // set up key press handler for the lifetime of the component
  const [currentLine, setCurrentLine] = useState(0);

  useKeyboardHandler(key => {
    if (key !== 'e') {
      return;
    }
    if (currentTextLines) {
      if (currentLine + 1 < currentTextLines.length) {
        setCurrentLine(n => n + 1);
        return;
      }
    }
    if (options) {
      setCurrentLine(n => n + 1);
      return;
    }
    setCurrentLine(0);
    dispatch(continueDialogue(key));
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
          { !displayLine && options &&
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
      return setOptionChoice(c => (c - 1) % options.length);
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
