import { Component, useState, useEffect, useRef } from "react";

import AceEditor from "react-ace";
import { Range } from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow";

import { EngineContext } from "./engine";
import ScriptRunner from "../script-runner/script-runner";

import "./code-executor.less";

// source script to run - this gets transpiled from ES6 to normal ES5, then
// run inside of a JS-based JS interpreter so that it is totally sandboxed
const srcScript =
`
async function transpiled (n) {
  if (n < 1) {
    return;
  }
  console.log('N', n);
  await Promise.all([
    transpiled(n - 1),
    transpiled(n - 2)
  ]);
  console.log(n, 'done');
}
transpiled(4);
`;

function _CodeExecutor () {
  const editorRef = useRef(null);
  const [state, setState] = useState({
    scriptRunner: null,
    highlightedTextSegment: [null, null],
    currentLine: null,
    editorContents: srcScript,
  });
  useEffect(() => {
    const scriptRunner = new ScriptRunner(srcScript);
    setState({ ...state, scriptRunner });
    let t = 0;
    function onFrame () {
      const editor = editorRef.current;

      if (scriptRunner.ready && !(t++ % 20)) {
        if (!scriptRunner.hasNextStep) {
          return;
        }
        let highlightedTextSegment = [null, null];
        let start = null;
        let currentLine = scriptRunner.getExecutingLine();
        if (editor) {
          const session = editor.getSession();
          session.removeGutterDecoration(currentLine, "test-dec");
        }

        let i = 0;
        while (!start && scriptRunner.hasNextStep() && i++ < 1000) {
          scriptRunner.doCurrentLine();
          highlightedTextSegment = scriptRunner.getExecutingSection();
          [start] = highlightedTextSegment;
          currentLine = scriptRunner.getExecutingLine();
        }

        if (editor) {
          const session = editor.getSession();

          const ms = session.getMarkers();
          Object.keys(ms).forEach(k => {
            const m = ms[k];
            if (m.clazz === "test-dec") {
              session.removeMarker(m.id);
            }
          });

          // session.addGutterDecoration(currentLine, "test-dec");
          const markerRange = new Range(currentLine, 0, currentLine, 100)
          session.addMarker(markerRange, "test-dec", "screenLine", false);
          session.addGutterDecoration(currentLine, "test-dec");
        }

        setState(s => ({ ...s, highlightedTextSegment, currentLine }));
      }
      requestAnimationFrame(onFrame);
    }
    onFrame();
  }, []);

  const { highlightedTextSegment, currentLine, editorContents } = state;
  const [start, end] = highlightedTextSegment;
  const parts = [];
  parts.push(srcScript.slice(0, start || 0));
  parts.push(<span key={1} className="highlighted">{srcScript.slice(start || 0, end || 0)}</span>);
  parts.push(srcScript.slice(end || 0, srcScript.length));
  let lineIndicator = null;
  if (currentLine) {
    const lineIndicatorStyle = {
      top: `${currentLine * 16 + 16}px`
    };
    lineIndicator = <span
      className="line-indicator"
      style={lineIndicatorStyle}
      >{">"}</span>;
  }
  return <div>
    <div className="script-display">{parts}{lineIndicator}</div>
    <div>
      <AceEditor
        mode="javascript"
        theme="tomorrow"
        onChange={v => {
          setState(s => ({ ...s, editorContents: v }));
        }}
        name="ACE_DIV_NAME"
        value={editorContents}
        setOptions={{
          showLineNumbers: true,
        }}
        readOnly={true}
        onLoad={editor => editorRef.current = editor}
      />
    </div>
  </div>;
}

export default class CodeExecutor extends Component {
  static contextType = EngineContext;
  constructor() {
    super();
    this.state = {
      running: false,
      scriptContents: srcScript
    };

    this.scriptRunner = null;
    this.editor = null;

    this._loadEditor = this._loadEditor.bind(this);
    this._onChange = this._onChange.bind(this);
    this._run = this._run.bind(this);
    this._continueRunning = this._continueRunning.bind(this);
  }
  render() {
    const {
      scriptContents,
      running
    } = this.state;
    return <div className="code-executor">
      <div className="toolbar">
        <button onClick={this._run} disabled={running}>run</button>
      </div>
      <AceEditor
        name="__editor__"
        mode="javascript"
        theme="tomorrow"
        onChange={this._onChange}
        value={scriptContents}
        readOnly={running}
        onLoad={this._loadEditor}
        setOptions={{
          showLineNumbers: true,
        }}
        />
    </div>;
  }
  _loadEditor(editor) {
    this.editor = editor;
  }
  _onChange(scriptContents) {
    this.setState({ scriptContents });
  }
  async _run() {
    const {
      running,
      scriptContents
    } = this.state;
    if (running) {
      return;
    }

    this.scriptRunner = new ScriptRunner(scriptContents);
    await this.scriptRunner.readyPromise;

    this.t = 0;
    this.currentLine = 0;
    this.markerId = null;

    this.setState({ running: true });
    this._continueRunning();
  }
  _continueRunning() {
    if (this.t++ % 5 !== 0) {
      requestAnimationFrame(this._continueRunning);
      return;
    }

    const session = this.editor.getSession();

    // clear current line indicator
    if (this.currentLine !== null) {
      session.removeGutterDecoration(this.currentLine, "active-line-gutter");
    }
    if (this.markerId !== null) {
      session.removeMarker(this.markerId);
      this.markerId = null;
    }

    // stop execution if we're finished
    if (!this.scriptRunner.hasNextStep()) {
      // update running state
      this.currentLine = null;
      this.setState({ running: false });
      return;
    }

    // execute some code
    const scriptRunner = this.scriptRunner;
    let highlightedTextSegment = [null, null];
    let start = null;
    let currentLine = null;
    let i = 0;
    while (!start && scriptRunner.hasNextStep() && i++ < 1000) {
      scriptRunner.doCurrentLine();
      highlightedTextSegment = scriptRunner.getExecutingSection();
      [start] = highlightedTextSegment;
    }
    currentLine = scriptRunner.getExecutingLine();
    this.currentLine = currentLine;

    // add current line indicator
    if (currentLine !== null) {
      const markerRange = new Range(currentLine, 0, currentLine + 1, 100);
      this.markerId = session.addMarker(markerRange, "active-line-marker", "screenLine", false);
      session.addGutterDecoration(currentLine, "active-line-gutter");
    }

    // keep executing
    requestAnimationFrame(this._continueRunning);
  }
}
