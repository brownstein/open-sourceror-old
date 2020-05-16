import {
  Box3,
  Color,
  DoubleSide,
  Face3,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Object3D,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import {
  Body,
  Convex,
  Material,
  vec2
} from "p2";
import getThreeJsObjectForP2Body from "./p2-utils/get-threejs-mesh";

const _center = new Vector3();
const _simpleEdgeMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  wireframe: true,
  color: "#000000"
});

export const groundMaterial = new Material();

export default class ComplexShape {
  constructor (polygons, tiles = [], p2Props = {}) {
    const _simpleMaterial = new MeshBasicMaterial({
      side: DoubleSide,
      color: new Color(
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      )
    });

    const geometry = new Geometry();
    this.body = new Body(p2Props);

    let vertexStartIndex = 0;
    polygons && polygons.forEach(polygon => {
      const convex = new Convex({ vertices: polygon.map(({x, y}) => [x, y])});
      convex.material = groundMaterial;
      const cm = vec2.create();
      for(let j = 0; j !== convex.vertices.length; j++){
        const v = convex.vertices[j];
        vec2.sub(v, v, convex.centerOfMass);
      }
      vec2.scale(cm, convex.centerOfMass, 1);
      this.body.addShape(convex, cm);
    });

    this.mesh = new Object3D();
    this.mesh.add(getThreeJsObjectForP2Body(this.body, true));

    // add tiles
    if (tiles && tiles.length) {
      const textureLoader = new TextureLoader();
      const texture = textureLoader.load(tiles[0].tile.srcImage);
      texture.magFilter = NearestFilter;
      const tileMat = new MeshBasicMaterial({
        side: DoubleSide,
        map: texture,
        transparent: true,
        opacity: 0.5
      });
      const tileGeom = new Geometry();
      tiles.forEach(tileInstance => {
        const tile = tileInstance.tile;
        tileGeom.vertices.push(new Vector3(tileInstance.x, tileInstance.y, 0));
        tileGeom.vertices.push(new Vector3(tileInstance.x + tile.srcWidth, tileInstance.y, 0));
        tileGeom.vertices.push(new Vector3(tileInstance.x + tile.srcWidth, tileInstance.y + tile.srcHeight, 0));
        tileGeom.vertices.push(new Vector3(tileInstance.x, tileInstance.y + tile.srcHeight, 0));
        const vtxIndex = tileGeom.vertices.length - 4;
        tileGeom.faces.push(new Face3(vtxIndex + 0, vtxIndex + 1, vtxIndex + 2));
        tileGeom.faces.push(new Face3(vtxIndex + 0, vtxIndex + 2, vtxIndex + 3));
        [
          [[0, 0], [1, 0], [1, 1]],
          [[0, 0], [1, 1], [0, 1]]
        ].forEach(faceUVs => {
          tileGeom.faceVertexUvs[0].push(faceUVs.map(([x, y]) =>
          new Vector2(
            (tile.srcX + (x * tile.srcWidth)) / tile.srcImageWidth,
            1-(tile.srcY + (y * tile.srcHeight)) / tile.srcImageHeight,
          )));
        });
      });
      const tileMesh = new Mesh(tileGeom, tileMat);
      tileMesh.position.z = 0.5;
      this.mesh.add(tileMesh);
    }

    this.t = Math.floor(Math.random() * 1000);
  }
  syncMeshWithBody () {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
    this.body.velocity[0] = 16 * Math.cos(this.t++ / 100);
  }
}
