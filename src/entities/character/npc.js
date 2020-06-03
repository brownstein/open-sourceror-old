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

export class NPC extends BaseEntity {
  constructor(props) {
    super(props);
    const { position, npcDialogue } = props;
    const color = new Color(0.2, 1, 0.2);

    this.body = new Body({
      mass: 0,
      position: castToVec2(position)
    });
    this.convex = new Convex({
      vertices: characterPolygon.vertices,
      sensor: true
    });
    this.body.addShape(this.convex);

    this.sensor = new Circle({
      radius: 50,
      sensor: true
    });
    this.body.addShape(this.sensor);

    this.mesh = getThreeJsObjectForP2Body(this.body, null, color);

    this.npcDialogue = npcDialogue.split("|").map(d => d.trim());
    this.npcDialogueStep = 0;

    this.dialogueEntity = null;
    this._onKeyEvent = this._onKeyEvent.bind(this);
  }
  _onKeyEvent(keyEvent) {
    const { engine } = this;
    console.log(keyEvent);
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
  collisionHandler(engine, shapeId, otherId, otherEntity) {
    if (shapeId !== this.sensor.id || otherEntity !== engine.controllingEntity) {
      return;
    }
    if (this.dialogueEntity) {
      return;
    }
    this.dialogueEntity = new DialogueEntity(
      vec2ToVector2(this.body.position).add(new Vector2(0, -16)),
      this.npcDialogue[this.npcDialogueStep]
    );
    engine.addEntity(this.dialogueEntity);
    engine.keyEventBus.on("keyboard-event", this._onKeyEvent);
  }
  endCollisionHandler(engine, shapeId, otherId, otherEntity) {
    if (shapeId !== this.sensor.id || otherEntity !== engine.controllingEntity) {
      return;
    }
    if (this.dialogueEntity) {
      engine.removeEntity(this.dialogueEntity);
      this.dialogueEntity = null;
      engine.keyEventBus.off("keyboard-event", this._onKeyEvent);
      this.npcDialogueStep = 0;
    }
  }
}

export class NPCDialogueSensor extends BaseEntity {
  constructor(props) {
    super(props);

  }
}
