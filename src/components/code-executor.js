import { Component, useState, useEffect, useRef } from "react";

import Ace, { Range } from "ace-builds/src-noconflict/ace";
import jsWorkerUrl from "file-loader!ace-builds/src-noconflict/worker-javascript";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow";
Ace.config.setModuleUrl(
  "ace/mode/javascript_worker",
  jsWorkerUrl
);
window.ace = Ace;

import AceEditor from "react-ace";

import { EngineContext } from "./engine";
import ScriptRunner from "script-runner";

import "./code-executor.less";

// source script to run - this gets transpiled from ES6 to normal ES5, then
// run inside of a JS-based JS interpreter so that it is totally sandboxed
const srcScript =
`"use strict";
while (true) {
  fire();
  console.log("fired");
}
`;

export default class CodeExecutor extends Component {
  static contextType = EngineContext;
  constructor() {
    super();
    this.state = {
      running: false,
      scriptContents: srcScript,
      runtimeException: null,
      compileTimeException: null,
      editorSize: null
    };

    this.scriptRunner = null;
    this.editor = null;

    this.currentLine = null;
    this.annotated = false;
    this.decorations = [];
    this.markerIds = [];

    this.editorContainerEl = null;

    this._loadEditor = this._loadEditor.bind(this);
    this._onChange = this._onChange.bind(this);
    this._run = this._run.bind(this);
    this._stop = this._stop.bind(this);
    this._continueRunning = this._continueRunning.bind(this);
  }
  componentDidMount() {
    const bbox = this.editorContainerEl.getBoundingClientRect();
    const { width, height } = bbox;
    this.setState({
      editorSize: { width, height }
    });
  }
  render() {
    const {
      scriptContents,
      running,
      runtimeException,
      compileTimeException,
      editorSize
    } = this.state;
    const errors = [];
    if (runtimeException) {
      errors.push(runtimeException);
    }
    if (compileTimeException) {
      errors.push(JSON.stringify([compileTimeException.toString(), compileTimeException.loc]));
    }
    let width = 400, height = 400;
    if (editorSize) {
      width = editorSize.width;
      height = editorSize.height;
    }
    return (
      <div className="code-executor">
        <div className="toolbar">
          <button onClick={this._run} disabled={running}>run</button>
          <button onClick={this._stop} disabled={!running}>stop</button>
        </div>
        <div className="editor-container" ref={r => this.editorContainerEl = r}>
          <AceEditor
            name="__editor__"
            mode="javascript"
            theme="tomorrow"
            onChange={this._onChange}
            value={scriptContents}
            readOnly={running}
            onLoad={this._loadEditor}
            onFocus={() => console.log('focus')}
            onBlur={() => console.log('blur')}
            width={width}
            height={height}
            setOptions={{
              showLineNumbers: true
            }}
            />
          { errors }
        </div>
      </div>
    );
  }
  _loadEditor(editor) {
    this.editor = editor;
  }
  _onChange(scriptContents) {
    this._clearMarkings();
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

    this._clearMarkings();

    this.scriptRunner = new ScriptRunner(scriptContents, engine, player);
    try {
      await this.scriptRunner.readyPromise;
    }
    catch (err) {
      this.setState({ compileTimeException: err });
      this.scriptRunner = null;
      const { line, column } = err.loc;
      this._markError(err.toString(), line - 1);
      return;
    }

    this.t = 0;
    this.currentLine = 0;
    this.markerId = null;

    this.setState({ running: true });
    this._continueRunning();
  }
  _clearMarkings() {
    const session = this.editor.getSession();
    if (this.annotated) {
      session.clearAnnotations();
      this.annotated = false;
    }
    if (this.decorations.length) {
      this.decorations.forEach(([l, clazz]) => session.removeGutterDecoration(l, clazz));
      this.decorations = [];
    }
    if (this.markerIds.length) {
      this.markerIds.forEach(m => session.removeMarker(m));
      this.markerIds = [];
    }
    this.markerIds = [];
  }
  _markError(text, row, column = null) {
    this._clearMarkings();
    // mark error in gutter
    const session = this.editor.getSession();
    session.setAnnotations([{
      type: "error",
      text,
      row,
      column
    }]);
    this.annotated = true;

    // mark error in text
    const markerRange = new Range(row, column ? column : 0, row, 100);
    const markerId = session.addMarker(markerRange, "terminated-line-marker", "screenLine", false);
    this.markerIds.push(markerId);
  }
  _stop() {
    const { running } = this.state;
    if (!running) {
      return;
    }

    this._clearMarkings();

    // add terminating line indicator
    const session = this.editor.getSession();
    const currentLine = this.currentLine;
    if (currentLine !== null) {
      const markerRange = new Range(currentLine, 0, currentLine + 1, 100);
      const markerId = session.addMarker(markerRange, "terminated-line-marker", "screenLine", false);
      this.markerIds.push(markerId);
      session.addGutterDecoration(currentLine, "terminated-line-gutter");
      this.decorations.push([currentLine, "terminated-line-gutter"]);
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

    this._clearMarkings();

    // stop execution if we're finished
    if (this.scriptRunner.hasCompletedExecution()) {
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
      try {
        scriptRunner.doCurrentLine();
      }
      catch (ex) {
        // when exceptions are thrown, stop on the current line and log the error
        console.error(ex);
        this.setState({ runtimeException: ex.toString() });
        this._stop();
        this._markError(ex.toString(), this.currentLine);
        this.scriptRunner = null;
        return;
      }
      highlightedTextSegment = scriptRunner.getExecutingSection();
      [start] = highlightedTextSegment;
    }
    currentLine = scriptRunner.getExecutingLine();
    this.currentLine = currentLine;

    // add current line indicator
    const session = this.editor.getSession();
    if (currentLine !== null) {
      const markerRange = new Range(currentLine, 0, currentLine + 1, 100);
      const markerId = session.addMarker(markerRange, "active-line-marker", "screenLine", false);
      this.markerIds.push(markerId);
      session.addGutterDecoration(currentLine, "active-line-gutter");
      this.decorations.push([currentLine, "active-line-gutter"]);
    }

    // keep executing
    requestAnimationFrame(this._continueRunning);
  }
}
