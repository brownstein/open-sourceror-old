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

const _center = new Vector3();
const _simpleMaterial = new MeshBasicMaterial({
  side: DoubleSide
});
const _simpleEdgeMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  wireframe: true,
  color: "#000000"
});

export default class SimpleShape {
  constructor (vertices, p2Props = {}) {
    // // construct matter.js vertices
    // const mVerts = Vertices.create(vertices);
    // // extract the centroid - matter.js is going to offset everything by that,
    // // so do the same to the three.js vertices
    // const mCenter = Vertices.centre(mVerts);
    const threeCenter = new Vector3(0, 0, 0);
    // construct three.js geometry
    const geometry = new Geometry();
    vertices.forEach(v => {
      geometry.vertices.push(new Vector3(v.x, v.y, 0).sub(threeCenter));
    });
    const bbox = new Box3();
    geometry.vertices.forEach(v => bbox.expandByPoint(v));
    const center = new Vector3();
    bbox.getCenter(center);
    geometry.vertices.forEach(v => v.sub(center));
    for (let vi = 2; vi < geometry.vertices.length; vi++) {
      geometry.faces.push(new Face3(0, vi - 1, vi));
    }
    // construct three.js mesh
    const fillMesh = new Mesh(geometry, _simpleMaterial);
    const edgeMesh = new Mesh(geometry, _simpleEdgeMaterial);
    edgeMesh.position.z = 1;
    this.mesh = new Object3D();
    this.mesh.add(fillMesh);
    this.mesh.add(edgeMesh);
    // construct matter.js body
    const convex = new Convex({
      vertices: geometry.vertices.map(v => [v.x, v.y])
    });
    this.body = new Body(p2Props);
    this.body.addShape(convex);
  }
  syncMeshWithBody () {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
}
