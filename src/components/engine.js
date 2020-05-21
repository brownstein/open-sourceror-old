import EventEmitter from "events";
import { createContext, Component } from "react";
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

export class EngineProvider extends Component {
  constructor() {
    super();
    this.engine = new Engine();

    // DOM handling
    this.domElement = null;

    // running properties
    this.running = false;
    this.lastFrameTime = null;

    // bind event handlers
    this._updateLoop = this._updateLoop.bind(this);
    this._focusLost = this._focusLost.bind(this);
    this._focusGained = this._focusGained.bind(this);
  }
  componentDidMount() {
    // attach keyboard event listeners
    this.engine.ks.mount(document);

    // attach window focus events for automatic pausing
    window.onblur = this._focusLost;
    window.onfocus = this._focusGained;

    // start the engine
    this.running = true;
    this.lastFrameTime = new Date().getTime();
    this._updateLoop();

    const { addThings } = this.props;
    if (addThings) {
      addThings(this.engine);
    }
  }
  componentWillUnmount() {
    this.engine.ks.unmount();
  }
  render() {
    const { children } = this.props;
    return <div ref={r => this.domElement = r}>
      <EngineContext.Provider value={this.engine}>
        { children }
      </EngineContext.Provider>
    </div>;
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
  }
  _focusGained() {
    this.running = true;
    this.lastFrameTime = new Date().getTime();
  }
};
