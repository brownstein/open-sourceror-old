import {
  Color,
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

/**
 * Internal helper to iterate through frames with a given layer name - does not
 * support skipped frames, so don't skip any frames!
 */
function _iterateFrames(frames, layerName, onFrame) {
  if (Array.isArray(frames)) {
    throw new Error("array format not currently supported");
  }
  else {
    let frameNo = 0;
    let frame;
    while (frame = frames[`${layerName}-${frameNo}`]) {
      onFrame(frameNo, frame);
      frameNo++;
    }
  }
}

export class MultiLayerAnimatedSprite {
  /**
   * @constructor
   * @param spriteSheetImage - image URL 0f sprite sheet
   * @param spriteAnimations - animation definitions of the sprite sheet
   */
   constructor(spriteSheetImage, spriteDefinition) {
     this.spriteSheetImage = spriteSheetImage;
     this.spriteDefinition = spriteDefinition;

     this.texture = null;
     this.textureWidth = 128;
     this.textureHeight = 128;

     this.orderedLayers = [];
     this.framesByLayer = {};

     this.geometry = null;
     this.material = null;
     this.mesh = null;

     this.playingCurrentAnimation = false;
     this.currentAnimationName = null; // unused
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

     this.geometry = new Geometry();

     const { frames, meta } = this.spriteDefinition;
     for (let li = 0; li < meta.layers.length; li++) {

       // map frame data
       const layerIndex = li;
       const layerName = meta.layers[li].name;
       const layerColor = new Color(
         Math.random() * 0.4 + 0.6,
         Math.random() * 0.4 + 0.6,
         Math.random() * 0.4 + 0.6
       );
       this.orderedLayers.push({ layerName, layerColor });
       const layerFrames = [];
       _iterateFrames(frames, layerName, (frameNo, frame) => {
         this.frameDurations[frameNo] = frame.duration; // double-assigned
         layerFrames.push(frame.frame);
       });
       this.framesByLayer[layerName] = layerFrames;

       // seed geometry
       const z = layerIndex * 0.1;
       const vi = li * 4;
       const n = null;
       this.geometry.vertices.push(new Vector3(-1, -1, z));
       this.geometry.vertices.push(new Vector3(1, -1, z));
       this.geometry.vertices.push(new Vector3(1, 1, z));
       this.geometry.vertices.push(new Vector3(-1, 1, z));
       this.geometry.faces.push(new Face3(vi, vi + 1, vi + 2, n, layerColor));
       this.geometry.faces.push(new Face3(vi, vi + 2, vi + 3, n, layerColor));
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
     }

     // load the material - we'll use it for the full geometry
     this.material = new MeshBasicMaterial({
       map: this.texture,
       side: DoubleSide,
       transparent: true,
       alphaTest: 0.1,
       vertexColors: true
     });

     this.mesh = new Mesh(this.geometry, this.material);

     // go to first frame
     this._gotoFrame(0);
     this.playingCurrentAnimation = true;

     this.ready = true;
   }
   _gotoFrame(frameNo) {
     const cappedFrameNo = frameNo % this.frameDurations.length;
     for (let li = 0; li < this.orderedLayers.length; li++) {
       const layer = this.orderedLayers[li];
       const vtxOffset = li * 4;
       const faceOffset = li * 2;
       const { layerName, layerColor } = layer;
       const layerFrame = this.framesByLayer[layerName][cappedFrameNo];
       const { x, y, w, h } = layerFrame;
       const iw = 1 / this.textureWidth;
       const ih = 1 / this.textureHeight;
       this.geometry.vertices[vtxOffset + 0].x = w * -0.5;
       this.geometry.vertices[vtxOffset + 0].y = h * -0.5;
       this.geometry.vertices[vtxOffset + 1].x = w * 0.5;
       this.geometry.vertices[vtxOffset + 1].y = h * -0.5;
       this.geometry.vertices[vtxOffset + 2].x = w * 0.5;
       this.geometry.vertices[vtxOffset + 2].y = h * 0.5;
       this.geometry.vertices[vtxOffset + 3].x = w * -0.5;
       this.geometry.vertices[vtxOffset + 3].y = h * 0.5;
       this.geometry.faceVertexUvs[0][faceOffset + 0][0].x = x * iw;
       this.geometry.faceVertexUvs[0][faceOffset + 0][0].y = 1 - y * ih;
       this.geometry.faceVertexUvs[0][faceOffset + 0][1].x = (x + w) * iw;
       this.geometry.faceVertexUvs[0][faceOffset + 0][1].y = 1 - y * ih;
       this.geometry.faceVertexUvs[0][faceOffset + 0][2].x = (x + w) * iw;
       this.geometry.faceVertexUvs[0][faceOffset + 0][2].y = 1 - (y + h) * ih;
       this.geometry.faceVertexUvs[0][faceOffset + 1][0].x = x * iw;
       this.geometry.faceVertexUvs[0][faceOffset + 1][0].y = 1 - y * ih;
       this.geometry.faceVertexUvs[0][faceOffset + 1][1].x = (x + w) * iw;
       this.geometry.faceVertexUvs[0][faceOffset + 1][1].y = 1 - (y + h) * ih;
       this.geometry.faceVertexUvs[0][faceOffset + 1][2].x = x * iw;
       this.geometry.faceVertexUvs[0][faceOffset + 1][2].y = 1 - (y + h) * ih;
     }

     this.geometry.verticesNeedUpdate = true;
     this.geometry.uvsNeedUpdate = true;

     this.currentAnimationFrame = frameNo;
   }
   switchToAnimation () {

   }
   pauseCurrentAnimation () {
     this.playingCurrentAnimation = false;
   }
   animate (timeDelta = 1000 / 60) {
     if (!this.playingCurrentAnimation) {
       return;
     }
     this.frameTime += timeDelta;
     const durations = this.frameDurations;
     const duration = durations[this.currentAnimationFrame % durations.length];
     if (this.frameTime >= duration) {
       this.frameTime -= duration;
       this._gotoFrame(this.currentAnimationFrame + 1);
     }
   }
}
