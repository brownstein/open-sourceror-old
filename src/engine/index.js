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
  World
} from "p2";

import KeyState from "./key-state";

export default class Engine extends EventEmitter {
  constructor() {
    super();

    // keyboard events
    this.ks = new KeyState();

    // rendering
    this.scene = new Scene();

    // physics
    this.world = new World({
      gravity:[0, 900]
    });

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
    this.followingEntity = null;
  }
  addEntity(entity) {
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
  }
  addLevelEntity(entity) {
    // TODO revise room geometry
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
    this.levelBBox.expandByObject(entity.mesh);
  }
  followEntity(entity) {
    this.followingEntity = entity;
  }
  removeEntity(entity) {
    this.activeEntities = this.activeEntities.filter(e => e !== entity);
    delete this.activeEntitiesByBodyId[entity.body.id];
    this.world.removeBody(entity.body);
    this.scene.remove(entity.mesh);
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
      this.cameras.forEach(cam => {
        cam.camera.position.copy(this.followingEntity.mesh.position)
      });
    }

    // emit frame event to child components for rendering
    this.emit("frame", { deltaTimeMs });
  }
}
