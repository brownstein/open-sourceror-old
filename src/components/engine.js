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

import KeyState from "../engine/key-state";

export const EngineContext = createContext();

export class EngineProvider extends Component {
  constructor() {
    super();
    this.ee = new EventEmitter();
    this.ks = new KeyState();

    // three.js
    this.scene = new Scene();

    // phase out
    this.cameraSize = { width: 400, height: 400 };
    this.camera = new OrthographicCamera(
      -this.cameraSize.width / 2, this.cameraSize.width / 2,
      -this.cameraSize.height / 2, this.cameraSize.height / 2,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));
    this.camera.position.copy(new Vector3(0, 0, 1));

    this.levelBBox = new Box3();
    this.levelBBox.expandByPoint(new Vector3(0, 0, 0));
    this.levelBBox.expandByPoint(new Vector3(64, 64, 0));

    // physics
    this.world = new World({
      gravity:[0, 900]
    });

    // shared context
    this.ctx = {
      ee: this.ee,
      ks: this.ks,
      cameraPosition: new Vector3(0, 0, 1),
      engine: this
    };

    // DOM handling
    this.domElement = null;

    // running properties
    this.running = false;
    this.lastFrameTime = null;

    // engine-level entities
    this.activeEntities = [];
    this.activeEntitiesByBodyId = {};
    this.followingEntity = null;

    // bind event handlers
    this._updateLoop = this._updateLoop.bind(this);
    this._focusLost = this._focusLost.bind(this);
    this._focusGained = this._focusGained.bind(this);
  }
  addEntity (entity) {
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
  }
  addLevelEntity (entity) {
    // TODO revise room geometry
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
    this.levelBBox.expandByObject(entity.mesh);
  }
  followEntity (entity) {
    this.followingEntity = entity;
  }
  removeEntity (entity) {
    this.activeEntities = this.activeEntities.filter(e => e !== entity);
    delete this.activeEntitiesByBodyId[entity.body.id];
    this.world.removeBody(entity.body);
    this.scene.remove(entity.mesh);
  }
  componentDidMount() {
    // attach keyboard event listeners
    this.ks.mount(document);

    // attach window focus events for automatic pausing
    window.onblur = this._focusLost;
    window.onfocus = this._focusGained;

    // start the engine
    this.running = true;
    this.lastFrameTime = new Date().getTime();
    this._updateLoop();

    const { addThings } = this.props;
    if (addThings) {
      addThings(this);
    }
  }
  componentWillUnmount() {
    this.ks.unmount();
  }
  render() {
    const { children } = this.props;
    return <div ref={r => this.domElement = r}>
      <EngineContext.Provider value={this.ctx}>
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
    const deltaTimeS = deltaTimeMs / 1000;
    this.lastFrameTime = currentFrameTime;

    // run P2
    const fixedTimeStep = 1 / 60; // seconds
    const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
    this.world.step(fixedTimeStep, deltaTimeS, maxSubSteps);

    // sync three with P2, do keyboard events
    this.activeEntities.forEach(e => {
      e.syncMeshWithBody && e.syncMeshWithBody(deltaTimeMs);
      e.runKeyboardMotion && e.runKeyboardMotion(this.ks);
      e.onFrame && e.onFrame(deltaTimeMs);
    });

    // run per-entity contact equation handlers
    const contactEquations = this.world.narrowphase.contactEquations;
    for (let eqi = 0; eqi < contactEquations.length; eqi++) {
      const eq = contactEquations[eqi];
      const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
      const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
      if (entityA && entityA.handleContactEquation) {
        entityA.handleContactEquation(eq, entityB);
      }
      if (entityB && entityB.handleContactEquation) {
        entityB.handleContactEquation(eq, entityA);
      }
    }

    // track camera
    if (this.followingEntity) {
      this.ctx.cameraPosition = this.followingEntity.mesh.position;

      this.camera.position.x = Math.max(
        this.levelBBox.min.x + this.cameraSize.width / 2,
        Math.min(
          this.levelBBox.max.x - this.cameraSize.width / 2,
          this.followingEntity.mesh.position.x
        )
      );
      this.camera.position.y = Math.max(
        this.levelBBox.min.y + this.cameraSize.height / 2,
        Math.min(
          this.levelBBox.max.y - this.cameraSize.height / 2,
          this.followingEntity.mesh.position.y
        )
      );
    }

    // emit frame event to child components for rendering
    this.ee.emit("frame", { deltaTimeMs });
  }
  _focusLost() {
    this.running = false;
  }
  _focusGained() {
    this.running = true;
    this.lastFrameTime = new Date().getTime();
  }
};
