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
import {
  setPlayerMana,
  setPlayerHealth
} from "src/redux/actions/status";
import {
  useItem
} from "src/redux/actions/inventory";
import { castToVec2, vec2ToVector3 } from "src/p2-utils/vec2-utils";

import { Push } from "src/entities/spells/push";
import { IceCrystal } from "src/entities/spells/ice";
import { Laser } from "src/entities/spells/laser";

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
    this._onKeyboardEvent = this._onKeyboardEvent.bind(this);
    this._unsubscribeFromStore = null;
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
  addDetector() {
    const detector = new Circle({
      radius: 64,
      sensor: true
    });
    this.body.addShape(detector);
    this.detectors.push(detector);
  }
  incrementHealth(diff) {
    super.incrementHealth(diff);

    // push stats to the store
    this.engine.store.dispatch(setPlayerHealth(this.health));
  }
  incrementMana(diff) {
    super.incrementMana(diff);

    // push stats to the store
    this.engine.store.dispatch(setPlayerMana(this.mana));
  }
  attachToEngine(engine) {
    this.engine.on("mousedown", this._onClick);
    this.engine.keyEventBus.on("keyboard-event", this._onKeyboardEvent);

    // pull current stats from the store
    this._syncStatus();

    // observe the store for additional status updates
    const store = this.engine.store;
    this._unsubscribeFromStore = store.subscribe(this._syncStatus.bind(this));
  }
  cleanup() {
    this.engine.off("mousedown", this._onClick);
    this.engine.keyEventBus.off("keyboard-event", this._onKeyboardEvent);
    if (this._unsubscribeFromStore) {
      this._unsubscribeFromStore();
      this._unsubscribeFromStore = null;
    }
  }
  _syncStatus() {
    const state = this.engine.store.getState();
    const status = state.status;
    this.health = status.health;
    this.maxHealth = status.maxHealth;
    this.mana = status.mana;
    this.maxMana = status.maxMana;
  }
  // cast function
  _onClick(event) {
    const { engine } = this;
    const { position } = event;
    const pos2 = castToVec2(position);

    // const ice = IceCrystal.createIceCrystal(
    //   engine,
    //   castToVec2(position)
    // );
    //
    // engine.addEntity(ice);

    // const push = new Push(
    //   this,
    //   pos2,
    //   50,
    //   100
    // );
    // engine.addEntity(push);

    const vector = pos2;
    vec2.sub(vector, vector, this.body.position);
    vec2.normalize(vector, vector);
    const laser = new Laser({
      fromEntity: this,
      position: this.body.position,
      vector
    });

    engine.addEntity(laser);
  }
  _onKeyboardEvent(event) {
    const { key, down } = event;
    const state = this.engine.store.getState();
    const { inventory } = state;
    if (down && inventory.numericHotkeyMap[key]) {
      const itemId = inventory.numericHotkeyMap[key];
      const item = inventory.inventory.find(item => item && item.id === itemId);
      if (item) {
        this.engine.store.dispatch(useItem(item.id));
        if (item.itemName === "Scroll" && item.itemData.scriptContents) {
          this.engine.scriptExecutionContext.runScript(
            item.itemData.scriptContents,
            this,
            1.0
          );
        }
      }
    }
  }
}
