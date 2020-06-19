import delay from "delay";
import {
  Geometry,
  MeshBasicMaterial,
  TextureLoader,
  Mesh,
  Vector2,
  Vector3,
  Object3D,
  Face3,
  NearestFilter,
  RepeatWrapping,
  ClampToEdgeWrapping,
} from "three";

export class RepeatingBackgroundImage {
  static _id = 1;
  constructor(textureImage, params = {}) {
    this.engine = null;

    this.cameraTracked = true;

    this.extendX = params.extendX || false;
    this.extendY = params.extendY || false;
    this.wrapX = params.wrapX || false;
    this.wrapY = params.wrapY || false;
    this.moveParallax = params.moveParallax || false;
    this.pixelScale = params.pixelScale || 1;
    this.parallaxCenter = params.parallaxCenter || new Vector2(0, 0);
    this.parallaxCoefficient = params.parallaxCoefficient || 0.1;
    this.layer = params.layer || 0;

    this.cameraSize = new Vector2();
    this.roomSize = new Vector3();
    this.roomCenter = new Vector3();

    this.geometry = new Geometry();
    this.geometry.vertices.push(new Vector3(-1, -1, 0));
    this.geometry.vertices.push(new Vector3(-1, 1, 0));
    this.geometry.vertices.push(new Vector3(1, 1, 0));
    this.geometry.vertices.push(new Vector3(1, -1, 0));
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

    const textureLoader = new TextureLoader();
    this.texture = null;
    this.imageSize = null;

    this.readyPromise = new Promise((resolve, reject) => {
      this.texture = textureLoader.load(textureImage, resolve, null, reject);
    })
    .then(() => {
      this.imageSize = new Vector2(
        this.texture.image.naturalWidth,
        this.texture.image.naturalHeight
      );
    });

    this.material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true
    });

    this.texture.magFilter = NearestFilter;
    this.texture.wrapS = this.wrapX ? RepeatWrapping : ClampToEdgeWrapping;
    this.texture.wrapT = this.wrapY ? RepeatWrapping : ClampToEdgeWrapping;

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.z = -31 + this.layer * 0.1;
    this.mesh.position.x = 100;
    this.mesh.position.y = 100;
  }
  async attachToEngine() {
    await this.readyPromise;
    await delay(200); // this should be long enough to load all other assets
    this.updateForScreenBBox(); // update the size to reflect the screen bbox
  }
  updateForScreenBBox() {
    const engine = this.engine;
    const levelBBox = engine.levelBBox;

    levelBBox.getSize(this.roomSize);
    levelBBox.getCenter(this.roomCenter);

    const scaledSize = this.imageSize.clone();
    scaledSize.multiplyScalar(this.pixelScale);
    const wrappedSize = scaledSize.clone();
    const wrapNumber = 3;
    if (this.extendX) {
      wrappedSize.x = this.roomSize.x * wrapNumber * this.pixelScale;
    }
    if (this.extendY) {
      wrappedSize.y = this.roomSize.y * wrapNumber * this.pixelScale;
    }
    const uvSize = new Vector2(
      wrappedSize.x / scaledSize.x,
      wrappedSize.y / scaledSize.y
    );

    // update vertex locations
    this.geometry.vertices[0].x = -wrappedSize.x * 0.5;
    this.geometry.vertices[0].y = -wrappedSize.y * 0.5;
    this.geometry.vertices[1].x = -wrappedSize.x * 0.5;
    this.geometry.vertices[1].y = wrappedSize.y * 0.5;
    this.geometry.vertices[2].x = wrappedSize.x * 0.5;
    this.geometry.vertices[2].y = wrappedSize.y * 0.5;
    this.geometry.vertices[3].x = wrappedSize.x * 0.5;
    this.geometry.vertices[3].y = -wrappedSize.y * 0.5;

    // update UV locatiobs
    this.geometry.faceVertexUvs[0][0][0].x = 0.5 - uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][0][0].y = 0.5 + uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][0][1].x = 0.5 - uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][0][1].y = 0.5 - uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][0][2].x = 0.5 + uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][0][2].y = 0.5 - uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][1][0].x = 0.5 - uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][1][0].y = 0.5 + uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][1][1].x = 0.5 + uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][1][1].y = 0.5 - uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][1][2].x = 0.5 + uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][1][2].y = 0.5 + uvSize.y * 0.5;

    this.geometry.verticesNeedUpdate = true;
    this.geometry.uvsNeedUpdate = true;
  }
  updateForCameraBBox(camera) {
    const engine = this.engine;
    const levelBBox = engine.levelBBox;

    this.cameraSize.x = camera.right - camera.left;
    this.cameraSize.y = camera.bottom - camera.top;

    const scaledSize = this.imageSize.clone();
    scaledSize.multiplyScalar(this.pixelScale);
    const wrappedSize = scaledSize.clone();
    const wrapNumber = 1.25;
    if (this.extendX) {
      wrappedSize.x = this.roomSize.x * wrapNumber * this.pixelScale + this.cameraSize.x;
    }
    if (this.extendY) {
      wrappedSize.y = this.roomSize.y * wrapNumber * this.pixelScale + this.cameraSize.y;
    }
    const uvSize = new Vector2(
      wrappedSize.x / scaledSize.x,
      wrappedSize.y / scaledSize.y
    );

    // update vertex locations
    this.geometry.vertices[0].x = -wrappedSize.x * 0.5;
    this.geometry.vertices[0].y = -wrappedSize.y * 0.5;
    this.geometry.vertices[1].x = -wrappedSize.x * 0.5;
    this.geometry.vertices[1].y = wrappedSize.y * 0.5;
    this.geometry.vertices[2].x = wrappedSize.x * 0.5;
    this.geometry.vertices[2].y = wrappedSize.y * 0.5;
    this.geometry.vertices[3].x = wrappedSize.x * 0.5;
    this.geometry.vertices[3].y = -wrappedSize.y * 0.5;

    // update UV locatiobs
    this.geometry.faceVertexUvs[0][0][0].x = 0.5 - uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][0][0].y = 0.5 + uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][0][1].x = 0.5 - uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][0][1].y = 0.5 - uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][0][2].x = 0.5 + uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][0][2].y = 0.5 - uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][1][0].x = 0.5 - uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][1][0].y = 0.5 + uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][1][1].x = 0.5 + uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][1][1].y = 0.5 - uvSize.y * 0.5;
    this.geometry.faceVertexUvs[0][1][2].x = 0.5 + uvSize.x * 0.5;
    this.geometry.faceVertexUvs[0][1][2].y = 0.5 + uvSize.y * 0.5;
  }
  trackWithCamera(camera) {
    this.mesh.position.x = camera.position.x + this.parallaxCenter.x;
    this.mesh.position.y = camera.position.y + this.parallaxCenter.y;
    if (this.moveParallax) {
      this.mesh.position.x -= this.parallaxCoefficient * (camera.position.x - this.roomCenter.x);
      this.mesh.position.y -= this.parallaxCoefficient * (camera.position.y - this.roomCenter.y);
    }
  }
}
