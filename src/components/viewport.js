import { Component } from "react";
import {
  Box3,
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";

import { EngineContext } from "./engine";

import "./viewport.less";

export class EngineViewport extends Component {
  static contextType = EngineContext;
  constructor(props) {
    super(props);

    this.camera = null;
    this.needsRender = false;
    this.renderer = null;

    this.canvasEl = null;

    this._renderFrame = this._renderFrame.bind(this);
    this._onResize = this._onResize.bind(this);
  }
  componentDidMount() {
    const { ee, cameraPosition } = this.context;

    this.cameraSize = { width: 400, height: 400 };
    this.camera = new OrthographicCamera(
      -this.cameraSize.width / 2, this.cameraSize.width / 2,
      -this.cameraSize.height / 2, this.cameraSize.height / 2,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));
    if (cameraPosition) {
      this.camera.position.copy(cameraPosition);
    }

    this.renderer = new WebGLRenderer({
      canvas: this.canvasEl,
      // alpha: true,
      // preserveDrawingBuffer: true
    });
    this.renderer.setClearColor(new Color("#444444"));
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // attach event listeners
    window.addEventListener("resize", this._onResize);

    // size canvas to the current size of it's container
    this._onResize();
    this._renderFrame();

    // start listening for rendering queues
    if (ee) {
      ee.on("frame", this._renderFrame);
    }
  }
  componentDidUpdate(prevProps) {

  }
  componentWillUnmount() {
    const { ee } = this.context;
    window.removeEventListener("resize", this._onResize);
    if (ee) {
      ee.off("frame", this._renderFrame);
    }
  }
  render() {
    return <div ref={r => this.viewportEl = r} className="viewport">
      <canvas ref={r => this.canvasEl = r}/>
    </div>;
  }
  _renderFrame() {
    const { engine, cameraPosition } = this.context;
    const { scene } = engine || {};
    if (!scene || !cameraPosition) {
      return;
    }

    const { levelBBox } = engine;
    this.camera.position.x = Math.max(
      levelBBox.min.x + this.cameraSize.width / 2,
      Math.min(
        levelBBox.max.x - this.cameraSize.width / 2,
        cameraPosition.x
      )
    );
    this.camera.position.y = Math.max(
      levelBBox.min.y + this.cameraSize.height / 2,
      Math.min(
        levelBBox.max.y - this.cameraSize.height / 2,
        cameraPosition.y
      )
    );

    this.renderer.render(scene, this.camera);
  }
  _onResize() {
    const rect = this.viewportEl.getBoundingClientRect();
    const { width, height } = rect;
    this.cameraSize = { width, height };
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = -height / 2;
    this.camera.bottom / height / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this._renderFrame();
  }
}
