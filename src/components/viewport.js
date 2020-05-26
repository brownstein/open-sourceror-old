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

import KeyState from "engine/key-state";
import { EngineContext } from "./engine";
import StatusOverlay from "./status-overlay";

import "./viewport.less";

export class EngineViewport extends Component {
  static contextType = EngineContext;
  constructor(props) {
    super(props);
    this.constrainCameraToScene = true;

    this.camera = null;
    this.needsRender = false;
    this.renderer = null;

    this.canvasEl = null;

    // focus context and keyboard events
    this.hasCursor = false;
    this.ks = new KeyState();

    // we need to keep hovering dialogue in the react state to force updates
    this.state = {
      hoveringDomEntities: []
    };

    this._onFrame = this._onFrame.bind(this);
    this._renderFrame = this._renderFrame.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onMouseenter = this._onMouseenter.bind(this);
    this._onMouseleave = this._onMouseleave.bind(this);
  }
  componentDidMount() {
    const engine = this.context;
    const { minCameraSize } = engine.cameras[0];

    this.ks.mount(document);

    this.cameraSize = { ...minCameraSize };
    this.camera = new OrthographicCamera(
      -this.cameraSize.width * 0.5, this.cameraSize.width * 0.5,
      -this.cameraSize.height * 0.5, this.cameraSize.height * 0.5,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));

    this.renderer = new WebGLRenderer({
      canvas: this.canvasEl,
      // alpha: true,
      // preserveDrawingBuffer: true
    });
    this.renderer.setClearColor(new Color("#444444"));
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // attach event listeners
    window.addEventListener("resize", this._onResize);
    this.viewportEl.addEventListener("mouseenter", this._onMouseenter);;
    this.viewportEl.addEventListener("mouseleave", this._onMouseleave);

    // size canvas to the current size of it's container
    this._onResize();
    this._queueRender();

    // start listening for rendering queues
    engine.on("frame", this._onFrame);

    // queue second resize to be sure (windows)
    requestAnimationFrame(this._onResize);
  }
  componentWillUnmount() {
    const engine = this.context;
    this.ks.unmount(document);
    window.removeEventListener("resize", this._onResize);
    this.viewportEl.removeEventListener("mouseenter", this._onMouseenter);
    this.viewportEl.removeEventListener("mouseleave", this._onMouseleave);
    engine.off("frame", this._onFrame);
  }
  render() {
    const { hoveringDomEntities } = this.state;
    const entityOverlays = hoveringDomEntities.map(
      ({ entity, position }, i) => (
        <div
          className="hovering-entity"
          key={i}
          style={{
            position: "absolute",
            left: position.x,
            top: position.y
          }}
        >
          { entity.hoverElement }
        </div>
      )
    );
    return <div ref={r => this.viewportEl = r} className="viewport">
      <canvas ref={r => this.canvasEl = r}/>
      <StatusOverlay/>
      { entityOverlays }
    </div>;
  }
  _onFrame() {
    const engine = this.context;
    const player = engine.controllingEntity;

    if (player && engine.running && this.hasCursor) {
      player.runKeyboardMotion(engine, this.ks);
    }

    this.needsRender = true;
    this._renderFrame();

    // update state with anything that needs to be positioned over the canvas
    if (
      engine.hoveringDomEntities.length ||
      this.state.hoveringDomEntities.length
    ) {
      const rect = this.viewportEl.getBoundingClientRect();
      const { width, height } = rect;

      const maxEntityBBoxSize = 100;
      const hoveringDomEntities = [];
      engine.hoveringDomEntities.forEach(entity => {
        const position = entity.hoverPosition.clone();
        position.project(this.camera);
        position.x = (0.5 + position.x * 0.5) * width;
        position.y = (0.5 - position.y * 0.5) * height;
        if (
          position.x >= -maxEntityBBoxSize &&
          position.x <= maxEntityBBoxSize + width &&
          position.y >= -maxEntityBBoxSize &&
          position.y <= maxEntityBBoxSize + height
        ) {
          hoveringDomEntities.push({
            entity,
            position
          });
        }
      });

      this.setState({
        hoveringDomEntities
      });
    }
  }
  _queueRender() {
    this.needsRender = true;
    requestAnimationFrame(this._renderFrame);
  }
  _renderFrame() {
    if (!this.needsRender) {
      return;
    }
    this.needsRender = false;
    const engine = this.context;
    const { scene, levelBBox, followingEntity } = engine;
    if (!scene) {
      return;
    }

    // track camera to whatever we're following
    if (followingEntity) {
      const cameraPosition = followingEntity.mesh.position;
      this.camera.position.x = cameraPosition.x;
      this.camera.position.y = cameraPosition.y;
      if (this.constrainCameraToScene) {
        this.camera.position.x = Math.max(
          levelBBox.min.x + this.cameraSize.width / 2,
          Math.min(
            levelBBox.max.x - this.cameraSize.width / 2,
            this.camera.position.x
          )
        );
        this.camera.position.y = Math.max(
          levelBBox.min.y + this.cameraSize.height / 2,
          Math.min(
            levelBBox.max.y - this.cameraSize.height / 2,
            this.camera.position.y
          )
        );
      }
    }

    // update entities that have to be moved with the camera
    engine.cameraTrackedEntities.forEach(e => e.trackWithCamera(this.camera));

    // render the frame
    this.renderer.render(scene, this.camera);
  }
  _onResize() {
    const rect = this.viewportEl.getBoundingClientRect();
    const { width, height } = rect;

    this.cameraSize = { width, height };
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = -height / 2;
    this.camera.bottom = height / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // update entities that have to be resized with the camera
    const engine = this.context;
    engine.cameraTrackedEntities.forEach(e => e.updateForCameraBBox(this.camera));

    this._queueRender();
  }
  _onMouseenter() {
    const engine = this.context;
    this.hasCursor = true;
    engine.handleViewportFocus(true);
  }
  _onMouseleave() {
    const engine = this.context;
    this.hasCursor = false;
    engine.handleViewportFocus(false);
  }
}
