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

import { Fireball } from "../fireball";

const CHARACTER_COLOR_SCHEME = {
  shoes: "#555555",
  body: "#ecbcb4",
  torso: "#444444",
  cloak: "#4488ff",
  pants: "#224488",
  "hair - close": "#ff0000",
  Cast: "#00f", // TODO: lowercase
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

    const detector = new Circle({
      radius: 64,
      sensor: true
    });
    this.body.addShape(detector);

    this.direction = "right";
    this.activeSpriteName = null;
    this.sprites = {};
    this.spriteOffsets = {};
    this.engine = null;

    this.spritesLoaded = false;
    this.loadSprites();
  }
  async loadSprites() {
    this.sprites = {};
    await Promise.all(
      [
        ["walk", walkLayersImage, walkLayersSheet, new Vector3(0, 8, 1)],
        ["cast", castImage, castSheet, new Vector3(7, 8, 1)],
        ["midJump", midJumpImage, midJumpSheet, new Vector3(0, 8, 1)]
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
      this.plannedAccelleration[1] = -this.jumpAccelleration;
    }
    if (ks.isKeyDown("s")) {
      this.plannedAccelleration[1] = this.accelleration[1];
    }
  }
  castFireball() {
    const fireball = new Fireball(this, this.body.position);
    vec2.copy(fireball.body.velocity, this.body.velocity);
    if (this.facingRight) {
      fireball.body.position[0] += 30;
      fireball.body.velocity[0] += 200;
      fireball.body.velocity[1] -= 100;
    }
    else {
      fireball.body.position[0] -= 30;
      fireball.body.velocity[0] -= 200;
      fireball.body.velocity[1] -= 100;
    }
    this.engine.addEntity(fireball);
  }
  handleViewportFocus(isFocused) {
    if (isFocused) {
      this._swapToSprite("walk");
    }
    else {
      this._swapToSprite("cast");
    }
  }
}
