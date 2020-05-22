import { Component, useState, useEffect, useRef } from "react";

import AceEditor from "react-ace";
import { Range } from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow";

import { EngineContext } from "./engine";
import ScriptRunner from "script-runner";

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
    const engine = this.context;
    const player = engine.activeEntities[0];
    const {
      running,
      scriptContents
    } = this.state;
    if (running) {
      return;
    }

    this.scriptRunner = new ScriptRunner(scriptContents, engine, player);
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
