import EventEmitter from "events";
import { createContext, Component } from "react";
import { connect } from "react-redux";
import {
  Box3,
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";
import {
  ContactMaterial,
  World
} from "p2";

import Engine from "../engine";

export const EngineContext = createContext();

class _EngineProvider extends Component {
  constructor(props) {
    super();
    this.engine = new Engine();
    this.engine.store = props.store;

    // running properties
    this.running = false;
    this.loading = true;
    this.lastFrameTime = null;

    // bind event handlers
    this._updateLoop = this._updateLoop.bind(this);
    this._focusLost = this._focusLost.bind(this);
    this._focusGained = this._focusGained.bind(this);
  }
  componentDidMount() {
    // attach window focus events for automatic pausing
    window.onblur = this._focusLost;
    window.onfocus = this._focusGained;

    // start the engine
    this.running = true;
    this.engine.running = true;
    this.lastFrameTime = new Date().getTime();
    this._updateLoop();

    // bootstrap the scene
    const { addThings } = this.props;
    if (addThings) {
      this.running = false;
      this.loading = true;
      addThings(this.engine);
      this.engine.getLoadingPromise().then(() => {
        this.running = true;
        this.loading = false;
      });
    }
  }
  componentWillUnmount() {
    // this.engine.ks.unmount();
  }
  render() {
    const { children } = this.props;
    return (
      <EngineContext.Provider value={this.engine}>
        { children }
      </EngineContext.Provider>
    );
  }
  _updateLoop() {
    try {
      this._updateFrame();
    }
    catch (err) {
      console.error(err);
    }
    requestAnimationFrame(this._updateLoop);
  }
  _updateFrame() {
    if (!this.running) {
      return;
    }

    // timekeeping
    const currentFrameTime = new Date().getTime();
    const deltaTimeMs = currentFrameTime - this.lastFrameTime;
    this.lastFrameTime = currentFrameTime;

    // run the engine
    this.engine.step(deltaTimeMs);
  }
  _focusLost() {
    this.running = false;
    this.engine.running = false;
  }
  _focusGained() {
    this.running = true;
    this.engine.running = true;
    this.lastFrameTime = new Date().getTime();
  }
};

export const EngineProvider = connect()(_EngineProvider);
