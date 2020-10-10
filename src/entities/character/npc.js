import {
  Color,
  Vector2
} from "three";
import {
  Body,
  Convex,
  Circle
} from "p2";
import { castToVec2, vec2ToVector2 } from "src/p2-utils/vec2-utils";
import characterPolygon from "src/entities/character/base.json";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import BaseEntity from "src/entities/base";
import { DialogueEntity } from "src/entities/presentational/dialogue";
import { Sensor } from "src/entities/sensor";

export class NPC extends BaseEntity {
  static roomEntityNames = ["npc"];
  static roomInitializer(engine, obj, props) {
    const npc = new NPC({
      position: {
        x: obj.x,
        y: obj.y
      },
      npcDialogue: props.npcDialogue
    });
    engine.addEntity(npc);
    return npc;
  }

  constructor(props) {
    super(props);
    const { position, npcDialogue } = props;
    const color = new Color(0.2, 1, 0.2);

    this.body = new Body({
      mass: 1,
      position: castToVec2(position)
    });
    this.convex = new Convex({
      vertices: characterPolygon.vertices,
      // sensor: true
    });
    this.body.addShape(this.convex);
    this.mesh = getThreeJsObjectForP2Body(this.body, true, color);

    // set to not collide with the player
    this.convex.collisionMask = 0b100;

    this.sensor = new Sensor(this, 50);
    this.sensor.attachUpdateHandler(this._onSensorUpdate.bind(this));
    this.children = [this.sensor];

    this.npcDialogue = npcDialogue.split("|").map(d => d.trim());
    this.npcDialogueStep = 0;

    this.dialogueEntity = null;
    this._onKeyEvent = this._onKeyEvent.bind(this);
  }
  _onKeyEvent(keyEvent) {
    const { engine } = this;
    if (keyEvent.key === "e" && keyEvent.down) {
      this.npcDialogueStep++;
      engine.removeEntity(this.dialogueEntity);
      if (this.npcDialogueStep < this.npcDialogue.length) {
        this.dialogueEntity = new DialogueEntity(
          vec2ToVector2(this.body.position).add(new Vector2(0, -16)),
          this.npcDialogue[this.npcDialogueStep]
        );
        engine.addEntity(this.dialogueEntity);
      }
    }
  }
  _onSensorUpdate() {
    const { sensor, engine } = this;
    const player = engine.controllingEntity;
    if (sensor.collidingWith.find(([_, other]) => other === player)) {
      if (this.dialogueEntity) {
        return;
      }
      this.npcDialogueStep = 0;
      this.dialogueEntity = new DialogueEntity(
        vec2ToVector2(this.body.position).add(new Vector2(0, -16)),
        this.npcDialogue[this.npcDialogueStep]
      );
      engine.addEntity(this.dialogueEntity);
      engine.keyEventBus.on("keyboard-event", this._onKeyEvent);
    }
    else {
      if (!this.dialogueEntity) {
        return;
      }
      engine.removeEntity(this.dialogueEntity);
      this.dialogueEntity = null;
      engine.keyEventBus.off("keyboard-event", this._onKeyEvent);
      this.npcDialogueStep = 0;
    }
  }
}
