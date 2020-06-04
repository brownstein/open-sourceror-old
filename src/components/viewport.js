import EventEmitter from "events";
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
import { TargetingReticle } from "src/entities/presentational/targeting";

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
    this.canvasSize = { width: 200, height: 200 };

    // focus context and keyboard events
    this.ks = new KeyState();

    // we need to keep hovering dialogue in the react state to force updates
    this.state = {
      hoveringDomEntities: []
    };

    // mouse coordinates
    this.mouseOnScreen = false;
    this.mouseScreenCoordinates = new Vector3(0, 0, 0);
    this.mouseSceneCoordinates = new Vector3(0, 0, 0);
    this.mouseEventEmitter = new EventEmitter();

    // targeting, camera positioning
    this.targetSceneFrameSize = new Vector2(300, 200);
    this.targetingReticle = new TargetingReticle(this);

    this._onFrame = this._onFrame.bind(this);
    this._renderFrame = this._renderFrame.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onMouseenter = this._onMouseenter.bind(this);
    this._onMouseleave = this._onMouseleave.bind(this);
    this._onMousemove = this._onMousemove.bind(this);
    this._onMousedown = this._onMousedown.bind(this);
    this._onMouseup = this._onMouseup.bind(this);
    this._onClick = this._onClick.bind(this);
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
    this.viewportEl.addEventListener("mouseenter", this._onMouseenter);
    this.viewportEl.addEventListener("mouseleave", this._onMouseleave);
    this.viewportEl.addEventListener("mousemove", this._onMousemove);
    this.viewportEl.addEventListener("mousedown", this._onMousedown);
    this.viewportEl.addEventListener("mouseup", this._onMouseup);
    this.viewportEl.addEventListener("click", this._onClick);

    // size canvas to the current size of it's container
    this._onResize();
    this._queueRender();

    // start listening for rendering queues
    engine.on("frame", this._onFrame);

    // add targeting reticle to the scene
    engine.addEntity(this.targetingReticle);

    // queue second resize to be sure (windows)
    requestAnimationFrame(this._onResize);
  }
  componentWillUnmount() {
    const engine = this.context;
    this.ks.unmount(document);
    window.removeEventListener("resize", this._onResize);
    this.viewportEl.removeEventListener("mouseenter", this._onMouseenter);
    this.viewportEl.removeEventListener("mouseleave", this._onMouseleave);
    this.viewportEl.removeEventListener("mousemove", this._onMousemove);
    this.viewportEl.removeEventListener("mousedown", this._onMousedown);
    this.viewportEl.removeEventListener("mouseup", this._onMouseup);
    this.viewportEl.removeEventListener("click", this._onClick);
    engine.off("frame", this._onFrame);
    engine.removeEntity(this.targetingReticle);
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

    if (player && engine.running && this.mouseOnScreen) {
      player.runKeyboardMotion(engine, this.ks);
      this.ks.runEvents().forEach(e => {
        engine.keyEventBus.emit("keyboard-event", e)
      });
    }

    this.needsRender = true;
    this._renderFrame();

    // update state with anything that needs to be positioned over the canvas
    if (
      engine.hoveringDomEntities.length ||
      this.state.hoveringDomEntities.length
    ) {
      const { width, height } = this.canvasSize;

      const maxEntityBBoxSize = 100;
      const hoveringDomEntities = [];
      engine.hoveringDomEntities.forEach(entity => {
        const position = this.getOnscreenPosition(entity.hoverPosition);
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
  getOnscreenPosition(position, inPlace = false) {
    const { width, height } = this.canvasSize;
    const pos = inPlace ? position : position.clone();
    pos.project(this.camera);
    pos.x = (0.5 + pos.x * 0.5) * width;
    pos.y = (0.5 - pos.y * 0.5) * height;
    return pos;
  }
  getScenePositionForScreenPosition(position, inPlace = false) {
    const { width, height } = this.canvasSize;
    const pos = inPlace ? position : position.clone();
    pos.x = ((pos.x / width) - 0.5) * 2;
    pos.y = (0.5 - (pos.y / height)) * 2;
    pos.unproject(this.camera);
    return pos;
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

    // update the cursor's onscreen coordinates
    this.mouseSceneCoordinates.copy(this.mouseScreenCoordinates);
    this.getScenePositionForScreenPosition(this.mouseSceneCoordinates, true);

    // update entities that have to be moved with the camera
    engine.cameraTrackedEntities.forEach(e => e.trackWithCamera(this.camera));

    // sync meshes that depend on the viewport
    for (let ei = 0; ei < engine.activeEntities.length; ei++) {
      const entity = engine.activeEntities[ei];
      if (entity.syncMeshWithViewport) {
        entity.syncMeshWithViewport(this);
      }
    }

    // render the frame
    this.renderer.render(scene, this.camera);
  }
  _onResize() {
    const rect = this.viewportEl.getBoundingClientRect();
    const { width, height } = rect;
    this.canvasSize = { width, height };

    const targetSize = this.targetSceneFrameSize;
    const scale = Math.max(
      targetSize.x / width,
      targetSize.y / height
    );

    this.cameraSize = {
      width: width * scale,
      height: height * scale
    };
    this.camera.left = -this.cameraSize.width / 2;
    this.camera.right = this.cameraSize.width / 2;
    this.camera.top = -this.cameraSize.height / 2;
    this.camera.bottom = this.cameraSize.height / 2;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // update mouse coordinates in the scene
    this.mouseSceneCoordinates.copy(this.mouseScreenCoordinates);
    this.getScenePositionForScreenPosition(this.mouseSceneCoordinates, true);

    // update entities that have to be resized with the camera
    const engine = this.context;
    engine.cameraTrackedEntities.forEach(e => e.updateForCameraBBox(this.camera));

    this._queueRender();
  }
  _onMouseenter() {
    const engine = this.context;
    this.mouseOnScreen = true;
    this.targetingReticle.setVisible(true);
    engine.handleViewportFocus(true);
  }
  _onMouseleave() {
    const engine = this.context;
    this.mouseOnScreen = false;
    this.targetingReticle.setVisible(false);
    engine.handleViewportFocus(false);
  }
  _onMousemove(event) {
    const { width, height } = this.canvasSize;
    this.mouseScreenCoordinates.x = event.clientX; // TODO: subtract canvas loc
    this.mouseScreenCoordinates.y = event.clientY; // TODO: subtract canvas loc
    this.mouseSceneCoordinates.copy(this.mouseScreenCoordinates);
    this.getScenePositionForScreenPosition(this.mouseSceneCoordinates, true);
  }
  _onMousedown(event) {
    this.mouseEventEmitter.emit("mousedown");
  }
  _onMouseup(event) {
    this.mouseEventEmitter.emit("mouseup");
  }
  _onClick(event) {
    this.mouseEventEmitter.emit("click");
  }
}
