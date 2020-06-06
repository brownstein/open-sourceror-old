import { Component, useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

// pull in Ace and configure it
import Ace, { Range } from "ace-builds/src-noconflict/ace";
import jsWorkerUrl from "file-loader?name=mode-javascript.worker!ace-builds/src-noconflict/worker-javascript";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow";
Ace.config.setModuleUrl(
  "ace/mode/javascript_worker",
  jsWorkerUrl
);
window.ace = Ace;

// pull in Ace editor afterwards
import AceEditor from "react-ace";

// pull in engine context
import { EngineContext } from "./engine";

import "./code-executor.less";

// source script to run - this gets transpiled from ES6 to normal ES5, then
// run inside of a JS-based JS interpreter so that it is totally sandboxed
const srcScript =
`"use strict";
const fire = require("fire");
const push = require("push");
const Sensor = require("sensor");

var s = new Sensor(100);
var active = true;

// our main attack loop is going to start running immediately and execute every
// 50 milliseconds
function keepGoing() {
  if (!active) {
    return;
  }
  s.getNearbyThings().forEach(n => {
    const relativeVelocity = {
      x: n.relativePosition.x * 5,
      y: n.relativePosition.y * 5
    };
    const relativePosition = {
      x: n.relativePosition.x,
      y: n.relativePosition.y + 10
    };
    fire(null, relativeVelocity);
    push(relativePosition, 20, 10);
  });
  setTimeout(keepGoing, 50);

  // un-comment to enable variable sensor radius
  // s.setRadius(30 + (new Date().getTime() % 1000) * 0.1);
}
keepGoing();

// set a timeout to end execution
setTimeout(() => {
  active = false;
}, 10000);
`;

class CodeExecutor extends Component {
  static contextType = EngineContext;
  constructor() {
    super();
    this.state = {
      scriptContents: srcScript,
      editorSize: { width: 400, height : 400 },
      executionSpeed: 1
    };
    // editor instance
    this.editor = null;

    // execution and markup state
    this.annotated = false;
    this.decorations = [];
    this.markerIds = [];

    // DOM element
    this.editorContainerEl = null;

    // bound methods
    this._loadEditor = this._loadEditor.bind(this);
    this._onChange = this._onChange.bind(this);
    this._setExecutionSpeed = this._setExecutionSpeed.bind(this);
    this._run = this._run.bind(this);
    this._pause = this._pause.bind(this);
    this._step = this._step.bind(this);
    this._resume = this._resume.bind(this);
    this._stop = this._stop.bind(this);
    this._onResize = this._onResize.bind(this);

    this._resetPlayerMana = this._resetPlayerMana.bind(this);
  }
  componentDidMount() {
    window.addEventListener("resize", this._onResize);
    this._onResize();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this._onResize);
  }
  _onResize() {
    const bbox = this.editorContainerEl.getBoundingClientRect();
    const { width, height } = bbox;
    this.setState({
      editorSize: { width, height }
    });
  }
  render() {
    const {
      running,
      paused
    } = this.props;
    const {
      scriptContents,
      editorSize,
      executionSpeed
    } = this.state;
    const errors = [];
    const { width, height } = editorSize;
    return (
      <div className="code-executor">
        <div className="toolbar">
          <button onClick={this._run} disabled={running}>run</button>
          <button onClick={this._stop} disabled={!running}>stop</button>
          <span>Speed:</span>
          <select value={executionSpeed} onChange={this._setExecutionSpeed} disabled={running}>
            <option value={0.0025}>0.0025</option>
            <option value={0.02}>0.02</option>
            <option value={0.1}>0.1</option>
            <option value={1}>1</option>
          </select>
          <button onClick={this._pause} disabled={!running || paused}>pause</button>
          <button onClick={this._step} disabled={!running || !paused}>step</button>
          <button onClick={this._resume} disabled={!running || !paused}>resume</button>
          <button className="hax" onClick={this._resetPlayerMana}>reset mana</button>
        </div>
        <div className="editor-container" ref={r => this.editorContainerEl = r}>
          { errors }
          <AceEditor
            name="__editor__"
            mode="javascript"
            theme="tomorrow"
            onChange={this._onChange}
            value={scriptContents}
            readOnly={running}
            onLoad={this._loadEditor}
            onFocus={() => {}}
            onBlur={() => {}}
            width={`${width}px`}
            height={`${height}px`}
            highlightActiveLine={!running}
            setOptions={{
              showLineNumbers: true
            }}
            />
        </div>
      </div>
    );
  }
  _loadEditor(editor) {
    this.editor = editor;
  }
  componentDidUpdate(prevProps) {
    const props = this.props;
    const editor = this.editor;
    if (props.running && props.currentLine) {
      this._markLine(props.currentLine, true);
    }
    if (prevProps.running && !props.running) {
      if (props.terminatedSuccessfully) {
        this._clearMarkings();
      }
      else if (props.runTimeError) {
        this._markError(props.runTimeError.toString(), props.currentLine);
      }
      else {
        this._markLine(props.currentLine, false);
      }
    }
    if (props.activeScriptContents !== this.state.scriptContents) {
      this._clearMarkings();
    }
    else if (props.compileTimeError) {
      const err = props.compileTimeError;
      this._markError(err, err.loc.line - 1);
    }
  }
  _onChange(scriptContents) {
    this._clearMarkings();
    this.setState({ scriptContents });
  }
  _setExecutionSpeed(event) {
    this.setState({ executionSpeed: event.target.value });
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
  }
  _markLine(line, isExecuting, finishedSuccessfully) {
    this._clearMarkings();

    const session = this.editor.getSession();
    let markerClass, gutterClass;
    if (isExecuting) {
      markerClass = "active-line-marker";
      gutterClass = "active-line-gutter";
    }
    else {
      markerClass = "terminated-line-marker";
      gutterClass = "terminated-line-gutter";
    }
    const markerRange = new Range(line, 0, line, Infinity);
    const markerId = session.addMarker(markerRange, markerClass, "screenLine", false);
    this.markerIds.push(markerId);
    session.addGutterDecoration(line, gutterClass);
    this.decorations.push([line, gutterClass]);
  }
  _markError(text, row, column = null) {
    this._clearMarkings();

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
    const markerId = session.addMarker(markerRange, "error-line-marker", "screenLine", false);
    this.markerIds.push(markerId);
    session.addGutterDecoration(row, "error-line-gutter");
    this.decorations.push([row, "error-line-gutter"]);
  }
  _run() {
    const { scriptContents } = this.state;
    const engine = this.context;
    const player = engine.controllingEntity;
    const exSpeed = this.state.executionSpeed;
    engine.scriptExecutionContext.runScript(scriptContents, player, exSpeed);
  }
  _pause() {
    const { activeScriptName } = this.props;
    const engine = this.context;
    engine.scriptExecutionContext.pauseScript(activeScriptName);
  }
  _step() {
    const { activeScriptName } = this.props;
    const engine = this.context;
    engine.scriptExecutionContext.stepScript(activeScriptName);
  }
  _resume() {
    const { activeScriptName } = this.props;
    const engine = this.context;
    engine.scriptExecutionContext.resumeScript(activeScriptName);
  }
  _stop() {
    const { activeScriptName } = this.props;
    const engine = this.context;
    engine.scriptExecutionContext.stopScript(activeScriptName);
  }

  // hax
  _resetPlayerMana() {
    const engine = this.context;
    const player = engine.controllingEntity;
    player.incrementMana(999);
  }
}

/**
 * Mapping from Redux store to passed props - does the heavy lifting
 */
function mapStateToProps(state) {
  const { scripts } = state;
  const { focusedScriptId, activeScripts } = scripts;

  let activeScriptName = null;
  let activeScriptContents = null;
  let running = false;
  let paused = false;
  let finished = false;
  let currentLine = null;
  let runTimeError = null;
  let { compileTimeError } = scripts;
  let terminatedSuccessfully = false;

  if (focusedScriptId) {
    const activeScript = activeScripts[focusedScriptId];
    if (activeScript) {
      activeScriptName = activeScript.scriptName;
      activeScriptContents = activeScript.scriptContents;
      running = activeScript.running;
      paused = activeScript.paused;
      finished = activeScript.finished;
      currentLine = activeScript.currentLine;
      runTimeError = activeScript.runTimeError;
      compileTimeError = activeScript.compileTimeError;
      terminatedSuccessfully = activeScript.finished;
    }
  }

  return {
    activeScriptName,
    activeScriptContents,
    running,
    paused,
    finished,
    currentLine,
    runTimeError,
    compileTimeError,
    terminatedSuccessfully,
  };
}

export default connect(mapStateToProps)(CodeExecutor);
