
export class StatefulSpriteSystem {
  constructor (spritesByName = null) {
    this.sprites = {};
    if (spritesByName) {
      Object.assign(this.sprites, spritesByName);
    }
    const firstKey = Object.keys(this.sprites)[0];
    this.activeSprite = this.sprites[firstKey];
    this.activeSprite.mesh.visible = true;
  }
  addSprite(spriteName, sprite) {
    this.sprites[spriteName] = sprite;
  }
  switchToSprite(spriteName) {
    this.activeSprite.mesh.visible = false;
    this.activeSprite = this.sprites[spriteName];
    this.activeSprite.mesh.visible = true;
  }
  clone() {
    const clonedSprites = {};
    Object.keys(this.sprites).forEach(k => {
      clonedSprites[k] = this.sprites[k];
    });
  }
  animate(timeDelta = 1000 / 60) {
    this.activeSprite.animate(timeDelta);
  }
  pauseCurrentAnimation() {
    this.activeSprite.pauseAnimation();
  }
  playCurrentAnimation() {
    this.activeSprite.playAnimation();
  }
}
