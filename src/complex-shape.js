import {
  Box3,
  DoubleSide,
  Face3,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three";
import {
  Body,
  Convex,
} from "p2";
import decomp from "poly-decomp";

const _center = new Vector3();
const _simpleMaterial = new MeshBasicMaterial({
  side: DoubleSide
});
const _simpleEdgeMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  wireframe: true,
  color: "#000000"
});

export default class ComplexShape {
  constructor (polygons, p2Props = {}) {
    console.log(polygons);
    const geometry = new Geometry();
    this.body = new Body(p2Props);

    let vertexStartIndex = 0;
    polygons.forEach(polygon => {
      polygon.forEach(({ x, y }) => {
        geometry.vertices.push(new Vector3(x, y, 0));
      });
      for (let fi = 2; fi < polygon.length; fi++) {
        geometry.faces.push(new Face3(vertexStartIndex, fi - 1, fi));
      }
      vertexStartIndex += polygon.length;
      const convex = new Convex({ vertices: polygon.map(({x, y}) => [x, y])});
      this.body.addShape(convex);
    });

    const fillMesh = new Mesh(geometry, _simpleMaterial);
    const edgeMesh = new Mesh(geometry, _simpleEdgeMaterial);
    edgeMesh.position.z = 1;
    this.mesh = new Object3D();
    this.mesh.add(fillMesh);
    this.mesh.add(edgeMesh);
  }
  syncMeshWithBody () {
    return;
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
}
