import EventEmitter from "events";
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
  World,
  Body,
  Box
} from "p2";

import RoomConstraint from "src/entities/room-constraint";
import KeyState from "./key-state";
import { ScriptExecutionContext } from "../script-runner/execution-context";

export default class Engine extends EventEmitter {
  constructor() {
    super();

    // keyboard events
    // this.ks = new KeyState();

    // rendering
    this.scene = new Scene();

    // physics
    this.world = new World({
      gravity:[0, 900]
    });
    this.world.sleepMode = World.BODY_SLEEPING;

    // script execution context
    this.scriptExecutionContext = new ScriptExecutionContext(this);

    // three.js camera positioning will be managed at the engine level for now
    const minCameraSize = { width: 200, height: 200 };
    const camera = new OrthographicCamera(
      -minCameraSize.width * 0.5, minCameraSize.width * 0.5,
      -minCameraSize.height * 0.5, minCameraSize.height * 0.5,
      -32, 32
    );
    camera.lookAt(new Vector3(0, 0, -1));
    camera.position.copy(new Vector3(0, 0, 1));
    this.cameras = [{
      minCameraSize,
      camera
    }];

    // we will keep track of the level's bounding box
    this.levelBBox = new Box3();
    this.levelBBox.expandByPoint(new Vector3(0, 0, 0));
    this.levelBBox.expandByPoint(new Vector3(64, 64, 0));

    // engine-level entities
    this.activeEntities = [];
    this.activeEntitiesByBodyId = {};

    // special entity references that typically target the player
    this.followingEntity = null;
    this.controllingEntity = null;

    // special entities that track with the camera
    this.cameraTrackedEntities = [];

    // special P2 constraint entities to enclose the current room
    this.roomConstraints = [];

    // connection to the controller and the Redux world (for script execution)
    this.controller = null;
    this.dispatch = null;

    // loading
    this.initEntityCount = 0;

    // set up P2 contact handlers
    this._initializeContactHandlers();
  }
  _initializeContactHandlers () {
    this.world.on("beginContact", event => {
      const { bodyA, bodyB, shapeA, shapeB, contactEquations } = event;
      const entityA = this.activeEntitiesByBodyId[bodyA.id];
      const entityB = this.activeEntitiesByBodyId[bodyB.id];
      if (!entityA || !entityB) {
        return;
      }
      if (entityA && entityA.collisionHandler) {
        const eq = contactEquations[0]; // .find(c => c.bodyA === bodyA);
        entityA.collisionHandler(this, bodyB.id, entityB, eq);
      }
      if (entityB && entityB.collisionHandler) {
        const eq = contactEquations[0]; //.find(c => c.bodyA === bodyB);
        entityB.collisionHandler(this, bodyA.id, entityA, eq);
      }
    });
    this.world.on("endContact", event => {
      const { bodyA, bodyB, shapeA, shapeB } = event;
      const entityA = this.activeEntitiesByBodyId[bodyA.id];
      const entityB = this.activeEntitiesByBodyId[bodyB.id];
      if (entityA && entityA.endCollisionHandler) {
        entityA.endCollisionHandler(this, bodyB.id, entityB);
      }
      if (entityB && entityB.endCollisionHandler) {
        entityB.endCollisionHandler(this, bodyA.id, entityA);
      }
    });
    this.world.on("preSolve", event => {
      const { contactEquations } = event;
      for (let eqi = 0; eqi < contactEquations.length; eqi++) {
        const eq = contactEquations[eqi];
        const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
        const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
        if (!entityA || !entityB) {
          return;
        }
        if (entityA && entityA.handleContactEquation) {
          entityA.handleContactEquation(this, eq.bodyB.id, entityB, eq);
        }
        if (entityB && entityB.handleContactEquation) {
          entityB.handleContactEquation(this, eq.bodyA.id, entityA, eq);
        }
      }
    });
  }
  addEntity(entity) {
    entity.engine = this;
    this.activeEntities.push(entity);
    if (entity.body) {
      this.activeEntitiesByBodyId[entity.body.id] = entity;
      this.world.addBody(entity.body);
    }
    if (entity.mesh) {
      this.scene.add(entity.mesh);
    }
    this._trackInit(entity);
  }
  expandSceneToFitEntity(entity) {
    if (entity.mesh) {
      this.levelBBox.expandByObject(entity.mesh);
    }
    this._trackInit(entity, () => this.levelBBox.expandByObject(entity.mesh));
  }
  /**
   * Constraints the current room in invisible walls to prevent anything from
   * inconvieniently escaping
   */
  constrainRoom() {
    this.roomConstraints.forEach(c => this.removeEntity(c));
    this.roomConstraints = [];
    const bboxSize = new Vector3();
    const bboxCenter = new Vector3();
    this.levelBBox.getSize(bboxSize);
    this.levelBBox.getCenter(bboxCenter);
    [
      [-bboxSize.x / 2 - 20, 0, 40, bboxSize.y],
      [bboxSize.x / 2 + 20, 0, 40, bboxSize.y],
      [0, -bboxSize.y / 2 - 20, bboxSize.x, 40],
      [0, bboxSize.y / 2 + 20, bboxSize.x, 40]
    ]
    .forEach(([x, y, width, height]) => {
      const constraint = new RoomConstraint({
        position: [bboxCenter.x + x, bboxCenter.y + y],
        size: [width, height]
      });
      this.roomConstraints.push(constraint);
      this.addEntity(constraint);
    });
  }
  cameraTrackEntity(entity) {
    this.cameraTrackedEntities.push(entity);
  }
  _trackInit(entity, onLoaded) {
    if (!entity.readyPromise) {
      return;
    }
    this.initEntityCount++;
    this.emit("loadingAssets", {});
    entity.readyPromise.then(() => {
      onLoaded && onLoaded();
      this.initEntityCount--;
      if (this.initEntityCount === 0) {
        this.emit("everythingReady", {});
      }
    });
  }
  /**
   * Helper for loading
   */
  getLoadingPromise() {
    return new Promise((resolve) => {
      if (this.initEntityCount === 0) {
        resolve();
      }
      function onReady() {
        resolve();
        this.off("everythingReady", onReady);
      }
      this.on("everythingReady", onReady);
    });
  }
  followEntity(entity) {
    this.followingEntity = entity;
  }
  setControllingEntity(entity) {
    this.controllingEntity = entity;
  }
  removeEntity(entity) {
    this.activeEntities = this.activeEntities.filter(e => e !== entity);
    if (entity.body) {
      delete this.activeEntitiesByBodyId[entity.body.id];
      this.world.removeBody(entity.body);
    }
    if (entity.mesh) {
      this.scene.remove(entity.mesh);
    }
    if (entity.emit) {
      entity.emit("remove", { entity });
    }
    if (entity.cameraTracked) {
      entity.cameraTracked = false;
      this.cameraTrackedEntities = this.cameraTrackedEntities.filter(e => e !== entity);
    }
  }
  /**
   * Primary run method
   */
  step(deltaTimeMs) {
    // run P2
    const deltaTimeS = deltaTimeMs / 1000;
    const fixedTimeStep = 1 / 60; // seconds
    const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
    this.world.step(fixedTimeStep, deltaTimeS, maxSubSteps);

    // sync three with P2, do keyboard events
    this.activeEntities.forEach(e => {
      e.syncMeshWithBody && e.syncMeshWithBody(deltaTimeMs);
      e.onFrame && e.onFrame(deltaTimeMs);
    });

    // run scripts
    this.scriptExecutionContext.onFrame(deltaTimeMs);

    // track camera
    if (this.followingEntity) {
      this.cameras.forEach(cam => {
        cam.camera.position.copy(this.followingEntity.mesh.position)
      });
    }

    // emit frame event to child components for rendering
    this.emit("frame", { deltaTimeMs });
  }
  /**
   * Viewport focus / defocus method - allows the character to react to the
   * user's focus state
   */
  handleViewportFocus(isFocused) {
    if (this.controllingEntity && this.controllingEntity.handleViewportFocus) {
      this.controllingEntity.handleViewportFocus(isFocused);
    }
  }
}
