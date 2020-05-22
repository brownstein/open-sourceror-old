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
while (true) {
  fire();
}
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
    this._stop = this._stop.bind(this);
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
        <button onClick={this._stop} disabled={!running}>stop</button>
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
  _stop() {
    const { running } = this.state;
    if (!running) {
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

    // add terminating line indicator
    const currentLine = this.currentLine;
    if (currentLine !== null) {
      const markerRange = new Range(currentLine, 0, currentLine + 1, 100);
      this.markerId = session.addMarker(markerRange, "terminated-line-marker", "screenLine", false);
      session.addGutterDecoration(currentLine, "terminated-line-gutter");
    }

    this.setState({ running: false });
  }
  _continueRunning() {
    const engine = this.context;
    const { running } = this.state;
    if (!running) {
      return;
    }

    if (this.t++ % 5 !== 0 || !engine.running) {
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
