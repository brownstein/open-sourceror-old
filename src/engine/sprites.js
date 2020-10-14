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

export class SimpleSprite {
  /**
   * @constructor
   * @param spriteImage - image URL of sprite sheet
   */
  constructor(spriteImage, options = {}) {
    this.spriteImage = spriteImage;

    this.color = options.color || "#ffffff";

    this.texture = null;
    this.textureWidth = 128;
    this.textureHeight = 128;

    this.geometry = null;
    this.material = null;
    this.mesh = null;

    this.ready = false;
    this.readyPromise = this._init();
  }
  async _init() {
    // TODO: inject this
    const textureLoader = new TextureLoader();

    // load the sprite's texture and extract dimensions
    this.texture = await textureLoader.loadAsync(this.spriteImage);
    this.texture.magFilter = NearestFilter;
    this.textureWidth = this.texture.image.naturalWidth;
    this.textureHeight = this.texture.image.naturalHeight;

    const w = this.textureWidth;
    const h = this.textureHeight;

    // initialize three.js geometry, material, texture
    this.geometry = new Geometry();
    this.geometry.vertices.push(new Vector3(-w * 0.5, -h * 0.5, 0));
    this.geometry.vertices.push(new Vector3( w * 0.5, -h * 0.5, 0));
    this.geometry.vertices.push(new Vector3( w * 0.5,  h * 0.5, 0));
    this.geometry.vertices.push(new Vector3(-w * 0.5,  h * 0.5, 0));
    this.geometry.faces.push(new Face3(0, 1, 2));
    this.geometry.faces.push(new Face3(0, 2, 3));
    this.geometry.faceVertexUvs[0].push([
      new Vector2(0, 1),
      new Vector2(1, 1),
      new Vector2(1, 0)
    ]);
    this.geometry.faceVertexUvs[0].push([
      new Vector2(0, 1),
      new Vector2(1, 0),
      new Vector2(0, 0)
    ]);

    // TODO: reuse this
    this.material = new MeshBasicMaterial({
      map: this.texture,
      side: DoubleSide,
      transparent: true,
      alphaTest: 0.1,
      color: this.color
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.ready = true;
  }
}


export class AnimatedSprite {
  /**
   * @constructor
   * @param spriteSheetImage - image URL of sprite sheet
   * @param spriteAnimations - animation definitions of the sprite sheet
   */
  constructor(spriteSheetImage, spriteDefinition, options = {}) {
    this.spriteSheetImage = spriteSheetImage;
    this.spriteDefinition = spriteDefinition;
    this.frameRegex = options.frameRegex || /.+ ([0-9]+).ase/;
    this.frameRegexIndex = options.frameRegexIndex || 1;

    this.texture = null;
    this.textureWidth = 128;
    this.textureHeight = 128;

    this.frames = [];

    this.geometry = null;
    this.material = null;
    this.mesh = null;

    this.playingCurrentAnimation = false;
    this.currentAnimationFrame = null;

    this.frameDurations = [];
    this.frameTime = 0;

    this.ready = false;
    this.readyPromise = this._init();
  }
  async _init() {
    // TODO: inject this
    const textureLoader = new TextureLoader();

    // load the sprite's texture and extract dimensions
    this.texture = await textureLoader.loadAsync(this.spriteSheetImage);
    this.texture.magFilter = NearestFilter;
    this.textureWidth = this.texture.image.naturalWidth;
    this.textureHeight = this.texture.image.naturalHeight;

    // initialize three.js geometry, material, texture
    this.geometry = new Geometry();
    this.geometry.vertices.push(new Vector3(-1, -1, 0));
    this.geometry.vertices.push(new Vector3(1, -1, 0));
    this.geometry.vertices.push(new Vector3(1, 1, 0));
    this.geometry.vertices.push(new Vector3(-1, 1, 0));
    this.geometry.faces.push(new Face3(0, 1, 2));
    this.geometry.faces.push(new Face3(0, 2, 3));
    this.geometry.faceVertexUvs[0].push([
      new Vector2(0, 0),
      new Vector2(1, 0),
      new Vector2(0, 1)
    ]);
    this.geometry.faceVertexUvs[0].push([
      new Vector2(0, 0),
      new Vector2(0, 1),
      new Vector2(1, 1)
    ]);

    // extract frame definitions
    const { frames, meta } = this.spriteDefinition;
    const orderedFrameNames = [];
    Object.keys(frames).forEach(frameName => {
      const execResult = this.frameRegex.exec(frameName);
      const frameNumber = Number(execResult[this.frameRegexIndex]);
      orderedFrameNames.push([frameNumber, frameName]);
    });
    orderedFrameNames.sort((a, b) => {
      if (a[0] > b[0]) return 1;
      if (a[0] < b[0]) return -1;
      return 0;
    });
    // map sorted names to frame definitions
    this.frames = orderedFrameNames.map(([n, frameName]) => {
      return frames[frameName];
    });

    // TODO: reuse this
    this.material = new MeshBasicMaterial({
      map: this.texture,
      side: DoubleSide,
      transparent: true,
      alphaTest: 0.1
    });

    this.mesh = new Mesh(this.geometry, this.material);

    // go to first frame of the current animation
    this._gotoFrame(0);

    this.ready = true;
  }
  _gotoFrame(frame) {
    const animationDefinition = this.animationDefinition;
    const animationFrames = this.frames;
    const animationFrame = animationFrames[frame % animationFrames.length];

    const { textureWidth, textureHeight } = this;
    const { x, y, w, h } = animationFrame.frame;

    // rescale geometry
    this.geometry.vertices[0].x = w * -0.5;
    this.geometry.vertices[0].y = h * -0.5;
    this.geometry.vertices[1].x = w * 0.5;
    this.geometry.vertices[1].y = h * -0.5;
    this.geometry.vertices[2].x = w * 0.5;
    this.geometry.vertices[2].y = h * 0.5;
    this.geometry.vertices[3].x = w * -0.5;
    this.geometry.vertices[3].y = h * 0.5;

    // reassign texture coordinates
    const invWidth = 1 / textureWidth;
    const invHeight = 1 / textureHeight;
    this.geometry.faceVertexUvs[0][0][0].x = x * invWidth;
    this.geometry.faceVertexUvs[0][0][0].y = 1 - y * invHeight;
    this.geometry.faceVertexUvs[0][0][1].x = (x + w) * invWidth;
    this.geometry.faceVertexUvs[0][0][1].y = 1 - y * invHeight;
    this.geometry.faceVertexUvs[0][0][2].x = (x + w) * invWidth;
    this.geometry.faceVertexUvs[0][0][2].y = 1 - (y + h) * invHeight;
    this.geometry.faceVertexUvs[0][1][0].x = x * invWidth;
    this.geometry.faceVertexUvs[0][1][0].y = 1 - y * invHeight;
    this.geometry.faceVertexUvs[0][1][1].x = (x + w) * invWidth;
    this.geometry.faceVertexUvs[0][1][1].y = 1 - (y + h) * invHeight;
    this.geometry.faceVertexUvs[0][1][2].x = x * invWidth;
    this.geometry.faceVertexUvs[0][1][2].y = 1 - (y + h) * invHeight;

    this.geometry.verticesNeedUpdate = true;
    this.geometry.uvsNeedUpdate = true;

    // update current animation frame
    this.currentAnimationFrame = frame;
  }
  playAnimation() {
    this.playingCurrentAnimation = true;
  }
  pauseAnimation() {
    this.playingCurrentAnimation = false;
  }
  animate(timeDelta = 1000 / 60) {
    if (!this.playingCurrentAnimation) {
      return;
    }
    this.frameTime += timeDelta;
    const animationFrames = this.frames;
    const animationFrame = animationFrames[this.currentAnimationFrame % animationFrames.length];
    const duration = animationFrame.duration || 10;
    if (this.frameTime >= duration) {
      this.frameTime -= duration;
      this._gotoFrame(this.currentAnimationFrame + 1);
    }
  }
}
