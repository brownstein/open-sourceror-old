import {
  DoubleSide,
  Face3,
  Geometry,
  Texture,
  TextureLoader,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Vector2,
  Vector3,
} from "three";
import { Body, Circle, vec2 } from "p2";
import { Character } from "./base";
import { AnimatedSprite } from "engine/sprites";
import { MultiLayerAnimatedSprite } from "engine/multi-layer-sprites";
import {
  walkLayersSheet,
  walkLayersImage,
  castSheet,
  castImage,
  midJumpSheet,
  midJumpImage
} from "./sprites/wizard";
import { incrementPlayerMana } from "src/redux/actions/status";
import { castToVec2, vec2ToVector3 } from "src/p2-utils/vec2-utils";

import { Fireball } from "src/entities/projectiles/fireball";
import { Laser } from "src/entities/spells/laser";
import { Push } from "src/entities/spells/push";

const CHARACTER_COLOR_SCHEME = {
  shoes: "#555555",
  body: "#ecbcb4",
  "head hand": "#ecbcb4",
  torso: "#444444",
  cloak: "#4488ff",
  pants: "#224488",
  "hair - close": "#ff0000",
  Cast: "#00f", // TODO: lowercase
  case: "#00f",
  code: "#0ff"
};
const CHARACTER_LAYERS = {
  "hair - big": false,
  "hood": false,
  "Hood": false, // TODO: lowercase
};

export class Player extends Character {
  constructor(props) {
    super(props);

    this.upHeld = false;
    this.direction = "right";
    this.activeSpriteName = null;
    this.sprites = {};
    this.spriteOffsets = {};

    this.detectors = [];

    this.targetCoordinates = new Vector3(0, 0, 0);

    this.spritesLoaded = false;
    this.readyPromise = this.loadSprites();

    this._onClick = this._onClick.bind(this);
  }
  async loadSprites() {
    this.sprites = {};
    await Promise.all(
      [
        ["walk", walkLayersImage, walkLayersSheet, new Vector3(0, 0, 1)],
        ["cast", castImage, castSheet, new Vector3(7, 0, 1)],
        ["midJump", midJumpImage, midJumpSheet, new Vector3(0, 0, 1)]
      ]
      .map(async ([name, image, sheet, relativeCenter]) => {
        const sprite = new MultiLayerAnimatedSprite(image, sheet, CHARACTER_LAYERS);
        await sprite.readyPromise;
        sprite.mesh.visible = false;
        sprite.recolor(CHARACTER_COLOR_SCHEME);
        sprite.mesh.position.copy(relativeCenter);
        this.mesh.add(sprite.mesh);
        this.sprites[name] = sprite;
        this.spriteOffsets[name] = relativeCenter;
      })
    );

    this.activeSpriteName = "walk";
    this.sprite = this.sprites.walk;
    this.sprites.walk.mesh.visible = true;

    this.mesh.children[0].visible = false;
    this.mesh.children[1].visible = false;

    this.spritesLoaded = true;
  }
  _swapToSprite(spriteName) {
    this.activeSpriteName = spriteName;
    if (!this.spritesLoaded) {
      return;
    }
    this.sprite.mesh.visible = false;
    this.sprite = this.sprites[spriteName];
    this.sprite.mesh.visible = true;
    const relativeCenter = this.spriteOffsets[spriteName];
    if (this.direction === "right") {
      this.sprite.mesh.position.copy(relativeCenter);
      this.sprite.mesh.scale.x = 1;
    }
    else {
      this.sprite.mesh.position.copy(relativeCenter);
      this.sprite.mesh.position.x *= -1;
      this.sprite.mesh.scale.x = -1;
    }
  }
  syncMeshWithBody(timeDelta) {
    super.syncMeshWithBody();
    if (!this.spritesLoaded) {
      return;
    }
    if (!this.previousPosition) {
      this.previousPosition = vec2.clone(this.body.position);
    }
    const distDelta = Math.abs(this.previousPosition[0] - this.body.position[0]);
    vec2.copy(this.previousPosition, this.body.position);
    // TODO: revise this to be less horrible, centralize
    if (this.onSurface) {
      if (this.activeSpriteName === "midJump") {
        this._swapToSprite("walk");
      }
    }
    else {
      if (this.activeSpriteName === "walk") {
        this._swapToSprite("midJump");
      }
    }
    if (this.activeSpriteName === "walk") {
      if (this.onSurface) {
        this.sprite.animate(distDelta * 5);
      }
    }
    else {
      this.sprite.animate(timeDelta);
    }
  }
  /**
   * Keyboard motion for player
   */
  runKeyboardMotion(engine, ks) {
    this.plannedAccelleration[1] = 0;
    if (ks.isKeyDown("d")) {
      this.plannedAccelleration[0] = this.accelleration[0];
      this.direction = "right";
      this.sprite.mesh.scale.x = 1;
    }
    else if (ks.isKeyDown("a")) {
      this.plannedAccelleration[0] = -this.accelleration[0];
      this.direction = "left";
      this.sprite.mesh.scale.x = -1;
    }
    if (ks.isKeyDown("w")) {
      if (!this.upHeld) {
        this.upHeld = true;
        this.plannedAccelleration[1] = -this.jumpAcceleration;
      }
    }
    else {
      this.upHeld = false;
    }
    if (ks.isKeyDown("s")) {
      this.plannedAccelleration[1] = this.accelleration[1];
    }
  }
  handleViewportFocus(isFocused) {
    if (isFocused) {
      if (this.onSurface) {
        this._swapToSprite("walk");
      }
      else {
        this._swapToSprite("midJump");
      }
    }
    else {
      this._swapToSprite("cast");
    }
  }
  // spell implementations
  castFireball(relativePosition = null, relativeVelocity = null) {
    const fireballPosition = vec2.clone(this.body.position);
    if (relativePosition) {
      vec2.add(fireballPosition, fireballPosition, relativePosition);
    }
    else {
      fireballPosition[0] += this.facingRight ? 30 : -30;
    }
    const fireball = new Fireball(this, fireballPosition);
    vec2.copy(fireball.body.velocity, this.body.velocity);
    if (relativeVelocity) {
      vec2.add(
        fireball.body.velocity,
        fireball.body.velocity,
        relativeVelocity
      );
    }
    else {
      fireball.body.velocity[0] += this.facingRight ? 200 : -100;
      fireball.body.velocity[1] -= 100;
    }
    this.engine.addEntity(fireball);
  }
  castLaser() {
    const { engine } = this;
    const laserPosition = vec2.clone(this.body.position);
    const targetPosition = castToVec2(this.targetCoordinates);
    const laser = new Laser({
      position: laserPosition,
      vector: targetPosition.clone().sub(laserPosition).normalize(),
      fromEntity: this
    });
    engine.addEntity(laser);
  }
  addDetector() {
    const detector = new Circle({
      radius: 64,
      sensor: true
    });
    this.body.addShape(detector);
    this.detectors.push(detector);
  }
  incrementMana(diff) {
    super.incrementMana(diff);
    this.engine.dispatch(incrementPlayerMana(diff));
  }
  attachToEngine(engine) {
    this.engine = engine;
    engine.on("click", this._onClick);
  }
  cleanup() {
    const { engine } = this;
    engine.off("click", this._onClick);
  }
  _onClick(event) {
    const { position } = event;
    const relativePosition = position.clone().sub(this.mesh.position);

    const push = new Push(
      this,
      this.mesh.position.clone().add(relativePosition),
      50,
      50
    );
    this.engine.addEntity(push);
    // this.castFireball(
    //   [0, 0],
    //   castToVec2(relativePosition.clone().multiplyScalar(5))
    // );
  }
}
