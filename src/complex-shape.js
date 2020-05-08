import {
  Box3,
  Color,
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
  vec2
} from "p2";

const _center = new Vector3();
const _simpleEdgeMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  wireframe: true,
  color: "#000000"
});

export default class ComplexShape {
  constructor (polygons, p2Props = {}) {

    const _simpleMaterial = new MeshBasicMaterial({
      side: DoubleSide,
      color: new Color(
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      )
    });

    console.log(polygons);
    const geometry = new Geometry();
    this.body = new Body(p2Props);

    let vertexStartIndex = 0;
    polygons.forEach(polygon => {
      polygon.forEach(({ x, y }) => {
        geometry.vertices.push(new Vector3(x, y, 0));
      });
      for (let fi = 2; fi < polygon.length; fi++) {
        geometry.faces.push(new Face3(
          vertexStartIndex,
          vertexStartIndex + fi - 1,
          vertexStartIndex + fi
        ));
      }
      vertexStartIndex += polygon.length;
      const convex = new Convex({ vertices: polygon.map(({x, y}) => [x, y])});
      const cm = vec2.create();
      for(let j = 0; j !== convex.vertices.length; j++){
        const v = convex.vertices[j];
        vec2.sub(v, v, convex.centerOfMass);
      }
      vec2.scale(cm, convex.centerOfMass, 1);
      this.body.addShape(convex, cm);
    });

    const fillMesh = new Mesh(geometry, _simpleMaterial);
    const edgeMesh = new Mesh(geometry, _simpleEdgeMaterial);
    edgeMesh.position.z = 1;
    this.mesh = new Object3D();
    this.mesh.add(fillMesh);
    this.mesh.add(edgeMesh);
  }
  syncMeshWithBody () {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
}
