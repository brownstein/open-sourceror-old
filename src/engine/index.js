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
  constructor(stateGetter) {
    super();

    // keyboard events
    this.keyEventBus = new EventEmitter();

    // rendering
    this.scene = new Scene();

    // physics
    this.world = new World({
      gravity:[0, 900]
    });
    this.world.sleepMode = World.BODY_SLEEPING;

    // script execution context
    this.scriptExecutionContext = new ScriptExecutionContext(this);

    // cameras are mostly handled at the viewport level - this array is an
    // artifact of when they were handled by the engine
    const minCameraSize = { width: 200, height: 200 };
    this.cameras = [{ minCameraSize }];

    // we will keep track of any entities with hovering DOM elements
    this.hoveringDomEntities = [];

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

    // pathfinding nav grid
    this.navGrid = null;

    // connection to the Redux world
    this.store = null;

    // loading
    this.initEntityCount = 0;

    // current room
    this.currentRoom = null;

    // running flag (controlled by controller)
    this.running = false;

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
      const eq = contactEquations[0] || null;
      if (entityA && entityA.collisionHandler) {
        entityA.collisionHandler(this, shapeA.id, bodyB.id, entityB, eq);
      }
      if (entityB && entityB.collisionHandler) {
        entityB.collisionHandler(this, shapeB.id, bodyA.id, entityA, eq);
      }
    });
    this.world.on("endContact", event => {
      const { bodyA, bodyB, shapeA, shapeB } = event;
      const entityA = this.activeEntitiesByBodyId[bodyA.id];
      const entityB = this.activeEntitiesByBodyId[bodyB.id];
      if (entityA && entityA.endCollisionHandler) {
        entityA.endCollisionHandler(this, shapeA.id, bodyB.id, entityB);
      }
      if (entityB && entityB.endCollisionHandler) {
        entityB.endCollisionHandler(this, shapeB.id, bodyA.id, entityA);
      }
    });
    this.world.on("preSolve", event => {
      const { contactEquations, frictionEquations } = event;
      for (let eqi = 0; eqi < contactEquations.length; eqi++) {
        const eq = contactEquations[eqi];
        const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
        const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
        if (!entityA || !entityB) {
          return;
        }
        if (entityA && entityA.handleContactEquation) {
          entityA.handleContactEquation(this, eq.shapeA.id, eq.bodyB.id, entityB, eq);
        }
        if (entityB && entityB.handleContactEquation) {
          entityB.handleContactEquation(this, eq.shapeB.id, eq.bodyA.id, entityA, eq);
        }
      }
      for (let eqi = 0; eqi < frictionEquations.length; eqi++) {
        const eq = frictionEquations[eqi];
        const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
        const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
        if (!entityA || !entityB) {
          return;
        }
        if (entityA && entityA.handleFrictionEquation) {
          entityA.handleFrictionEquation(this, eq.shapeA.id, eq.bodyB.id, entityB, eq);
        }
        if (entityB && entityB.handleFrictionEquation) {
          entityB.handleFrictionEquation(this, eq.shapeB.id, eq.bodyA.id, entityA, eq);
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
    if (entity.hoverElement) {
      this.hoveringDomEntities.push(entity);
    }
    if (entity.attachToEngine) {
      entity.attachToEngine(this);
    }
    if (entity.children) {
      entity.children.forEach(child => this.addEntity(child));
    }
    this._trackInit(entity);
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
    if (entity.hoverElement) {
      this.hoveringDomEntities = this.hoveringDomEntities.filter(e => e !== entity);
    }
    if (entity.cleanup) {
      entity.cleanup();
    }
    if (entity.children) {
      entity.children.forEach(child => this.removeEntity(child));
    }
  }
  getEntityByBodyId(bodyId) {
    return this.activeEntitiesByBodyId[bodyId] || null;
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

    const thickness = 200;
    const bboxSize = new Vector3();
    const bboxCenter = new Vector3();
    this.levelBBox.getSize(bboxSize);
    this.levelBBox.getCenter(bboxCenter);

    // extend terrain entities past the edge of the screen into their own
    // room constraints - this prevents us from getting stuck outside the room
    // after clipping
    this.activeEntities.forEach(e => {
      if (!e.isTerrain || !e.body) {
        return;
      }
      const bp = e.body.position;
      e.body.shapes.forEach(s => {
        if (!s.vertices) {
          return;
        }
        const sp = s.position;
        for (let vi = 0; vi < s.vertices.length; vi++) {
          const prevVtx = s.vertices[vi];
          const nextVtx = s.vertices[(vi + 1) % s.vertices.length];
          // calculate X and Y positions for vertices
          const x0 = bp[0] + sp[0] + prevVtx[0];
          const x1 = bp[0] + sp[0] + nextVtx[0];
          const y0 = bp[1] + sp[1] + prevVtx[1];
          const y1 = bp[1] + sp[1] + nextVtx[1];
          // continuation constraint for left of screen
          let constraint = null;
          if (x0 === x1 && x1 === 0) {
            constraint = new RoomConstraint({
              position: [x1 - thickness / 2, (y1 + y0) * 0.5],
              size: [thickness, Math.abs(y1 - y0)]
            });
          }
          // continuation constraint for right of screen
          else if (x0 === x1 && x1 === this.levelBBox.max.x) {
            constraint = new RoomConstraint({
              position: [x1 + thickness / 2, (y1 + y0) * 0.5],
              size: [thickness, Math.abs(y1 - y0)]
            });
          }
          // continuation constraint for top of screen
          else if (y0 === y1 && y1 === 0) {
            constraint = new RoomConstraint({
              position: [(x0 + x1) / 2, y0 - thickness],
              size: [Math.abs(x1 - x0), thickness]
            });
          }
          // continuation constraint for bottom of screen
          else if (y0 === y1 && y1 === this.levelBBox.max.y) {
            constraint = new RoomConstraint({
              position: [(x0 + x1) / 2, y0 + thickness],
              size: [Math.abs(x1 - x0), thickness]
            });
          }
          // add constraint to room constraint list and add to the scene
          if (constraint) {
            this.roomConstraints.push(constraint);
            this.addEntity(constraint);
          }
        }
      });
    });

    // add room constraints for outer bounding box of room
    [
      [-bboxSize.x / 2 - thickness / 2, 0, thickness, bboxSize.y],
      [bboxSize.x / 2 + thickness / 2, 0, thickness, bboxSize.y],
      [0, -bboxSize.y / 2 - thickness / 2, bboxSize.x, thickness],
      [0, bboxSize.y / 2 + thickness / 2, bboxSize.x, thickness]
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
  addNavGrid(navGrid) {
    if (this.navGrid) {
      this.navGrid.cleanup();
    }
    this.navGrid = navGrid;
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
  dispatch(event) {
    return this.store.dispatch(event);
  }
  /**
   * Gets a persistence snapshot for all entities that implement it
   */
  getSnapshot() {
    const snapshot = {};
    this.activeEntities.forEach(entity => {
      if (entity.persist && entity.persistId) {
        snapshot[entity.persistId] = entity.persist();
      }
    });
    return snapshot;
  }
}
