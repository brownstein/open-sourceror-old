import { Object3D } from "three";
import {
  Circle,
  Body,
  vec2
} from "p2";
import { AnimatedSprite } from "src/engine/sprites";
import { StatefulSpriteSystem } from "src/engine/stateful-sprite-system";
import BaseEntity from "src/entities/base";

import {
  runSheet,
  runImage,
  hangoutSheet,
  hangoutImage
} from "./sprites/fox";

export class Fox extends BaseEntity {
  static roomEntityNames = ["foxStart"];
  static roomInitializer(engine, obj, props) {
    const fox = new Fox({
      position: [obj.x, obj.y]
    });
    engine.addEntity(fox);
    return fox;
  }

  constructor(props) {
    super(props);

    this.body = new Body({
      mass: 20,
      damping: 0.1,
      friction: 0.9,
      fixedRotation: true,
      position: props.position,
      allowSleep: true
    });

    const foxShape = new Circle({
      radius: 8
    });

    this.mesh = new Object3D();

    this.body.addShape(foxShape, [0, 0]);

    this.jumping = false;
    this.runningRight = false;

    this.t = 0;

    this.spritesLoaded = false;
    this.readyPromise = this._loadSprites();
  }
  async _loadSprites() {
    const runSprite = new AnimatedSprite(runImage, runSheet);
    const sitSprite = new AnimatedSprite(hangoutImage, hangoutSheet);
    await runSprite.readyPromise;
    await sitSprite.readyPromise;
    this.spritesLoaded = true;
    sitSprite.playAnimation();
    runSprite.playAnimation();
    this.mesh.add(sitSprite.mesh);
    this.mesh.add(runSprite.mesh);
    this.spriteSystem = new StatefulSpriteSystem({
      run: runSprite,
      sit: sitSprite
    });
    this.spriteSystem.switchToSprite("run");
  }
  syncMeshWithBody(timeDelta) {
    super.syncMeshWithBody(timeDelta);
    if (this.spritesLoaded) {
      this.spriteSystem.animate(timeDelta);
    }
  }
  onFrame(timeDelta) {
    if (!this.spritesLoaded) {
      return;
    }
    const controllingEntity = this.engine.controllingEntity;

    // move to the right if the player is nearby, jump from time to time
    if (Math.abs(
      controllingEntity.body.position[0] -
      this.body.position[0]
    ) < 100) {
      this.t += timeDelta;
      this.body.velocity[0] += 10;
      this.spriteSystem.switchToSprite("run");
      // this.spriteSystem.playCurrentAnimation();
      if (this.t > 1000) {
        this.t = 0;
        this.body.velocity[1] -= 200;
      }
    }
    else {
      this.spriteSystem.switchToSprite("sit");
      // this.spriteSystem.playCurrentAnimation();
    }
  }
}
