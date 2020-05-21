import {
  Color,
  CircleGeometry,
  DoubleSide,
  Face3,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three";
import {
  Circle,
  Convex
} from "p2";

const simpleEdgeMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  wireframe: true,
  color: "#000000"
});

export default function getThreeJsObjectForP2Body (body, addWireframe = true) {
  const shapes = body.shapes;

  const obj3 = new Object3D();
  const mat = new MeshBasicMaterial({
    side: DoubleSide,
    transparent: true,
    opacity: 0.25,
    color: new Color(
      0.3 + 0.7 * Math.random(),
      0.3 + 0.7 * Math.random(),
      0.3 + 0.7 * Math.random()
    )
  });

  body.shapes.forEach(shape => {
    if (shape instanceof Convex) {
      const geom = new Geometry();
      for (let i = 0; i < 2; i++) {
        const [x, y] = shape.vertices[i];
        geom.vertices.push(new Vector3(x, y, 0));
      }
      for (let i = 2; i < shape.vertices.length; i++) {
        const [x, y] = shape.vertices[i];
        geom.vertices.push(new Vector3(x, y, 0));
        geom.faces.push(new Face3(0, i - 1, i));
      }
      const mesh = new Mesh(geom, mat);
      mesh.position.z = -1;
      mesh.position.x = shape.centerOfMass[0];
      mesh.position.y = shape.centerOfMass[1];
      obj3.add(mesh);
      if (addWireframe) {
        const wireframeMesh = new Mesh(geom, simpleEdgeMaterial);
        wireframeMesh.position.z = 1;
        wireframeMesh.position.x = shape.centerOfMass[0];
        wireframeMesh.position.y = shape.centerOfMass[1];
        obj3.add(wireframeMesh);
      }
    }
    else if (shape instanceof Circle) {
      const geom = new CircleGeometry(shape.radius, 32);
      const mesh = new Mesh(geom, mat);
      mesh.position.z = -1;
      mesh.position.x = shape.position[0];
      mesh.position.y = shape.position[1];
      obj3.add(mesh);
      if (addWireframe) {
        const wireframeMesh = new Mesh(geom, simpleEdgeMaterial);
        wireframeMesh.position.z = 1;
        wireframeMesh.position.x = shape.position[0];
        wireframeMesh.position.y = shape.position[1];
        obj3.add(wireframeMesh);
      }
    }
  });

  obj3.position.x = body.interpolatedPosition[0];
  obj3.position.y = body.interpolatedPosition[1];
  return obj3;
}
