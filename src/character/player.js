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
import { Body, Circle } from "p2";
import { Character } from "./base";
import { AnimatedSprite } from "../engine/sprites";
import { MultiLayerAnimatedSprite } from "../engine/multi-layer-sprites";
import {
  cycles as spriteCycles,
  image as spriteSheet,
  walkLayersSheet,
  walkLayersImage,
} from "../sprites/wizard";

import { Fireball } from "../game-objects/fireball";

const CHARACTER_COLOR_SCHEME = {
  shoes: "#ffffff",
  skin: "#ecbcb4",
  cape: "#aaccff"
};

export class Player extends Character {
  constructor() {
    super();

    const detector = new Circle({
      radius: 64,
      sensor: true
    });
    this.body.addShape(detector);

    this.contactListeners = [
      this._onContact.bind(this)
    ];

    this.spritesLoaded = false;
    this.loadSprites();
  }
  async loadSprites() {
    const relativeCenter = new Vector2(0, 8);
    // const sprite = new AnimatedSprite(spriteSheet, spriteCycles);
    const sprite = new MultiLayerAnimatedSprite(
      walkLayersImage,
      walkLayersSheet
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
      this.sprite.switchToAnimation("walkCycle");
    }
    this.sprite.animate(timeDelta);
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
      const fireball = new Fireball(this.body.position);
      engine.addEntity(fireball);
    };
  }
  _onContact(localShape, otherBody, otherShape) {
    // TODO: this
    // console.log('TODO implement contact event');
  }
}
