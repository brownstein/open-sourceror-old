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
  caseImage,
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
  "hair - close": "#ff0000"
};
const CHARACTER_LAYERS = {
  "hair - big": false,
  "hood": false
};

export class Player extends Character {
  constructor(props) {
    super(props);

    const detector = new Circle({
      radius: 64,
      sensor: true
    });
    this.body.addShape(detector);

    this.spritesLoaded = false;
    this.loadSprites();
  }
  async loadSprites() {
    const relativeCenter = new Vector2(0, 8);
    // const sprite = new AnimatedSprite(spriteSheet, spriteCycles);
    const sprite = new MultiLayerAnimatedSprite(
      walkLayersImage,
      walkLayersSheet,
      CHARACTER_LAYERS
    );
    await sprite.readyPromise;
    sprite.recolor(CHARACTER_COLOR_SCHEME);

    this.sprite = sprite;
    sprite.mesh.position.x = relativeCenter.x;
    sprite.mesh.position.y = relativeCenter.y;
    sprite.mesh.position.z = 1;
    this.mesh.add(sprite.mesh);

    this.mesh.children[0].visible = false;
    this.mesh.children[1].visible = false;

    this.spritesLoaded = true;
  }
  syncMeshWithBody(timeDelta) {
    super.syncMeshWithBody();
    if (!this.spritesLoaded) {
      return;
    }
    if (Math.abs(this.body.velocity[0]) < 0.5) {
      this.sprite.switchToAnimation("danceCycle");
    }
    else {
      this.sprite.switchToAnimation("walkCycle"); // TODO implement
    }
    if (!this.previousPosition) {
      this.previousPosition = vec2.clone(this.body.position);
    }
    const distDelta = Math.abs(this.previousPosition[0] - this.body.position[0]);
    vec2.copy(this.previousPosition, this.body.position);
    if (this.onSurface) {
      this.sprite.animate(distDelta * 5);
    }
  }
  runKeyboardMotion(engine, ks) {
    if (ks.isKeyDown("d")) {
      this.plannedAccelleration[0] = this.accelleration[0];
      this.sprite.mesh.scale.x = 1;
    }
    else if (ks.isKeyDown("a")) {
      this.plannedAccelleration[0] = -this.accelleration[0];
      this.sprite.mesh.scale.x = -1;
    }
    if (ks.isKeyDown("w")) {
      this.plannedAccelleration[1] = -this.jumpAccelleration;
    }
    if (ks.isKeyDown("s")) {
      this.plannedAccelleration[1] = this.accelleration[1];
    }

    // fireball
    if (ks.isKeyDown("e")) {
      this.castFireball();
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
}
