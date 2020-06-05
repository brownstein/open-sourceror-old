import {
  Ray,
  RayCastResult,
  vec2
} from "p2";
import {
  Color,
  Geometry,
  Face3,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector3
} from "three";
import {
  vec2ToVector3
} from "src/p2-utils/vec2-utils";

export class Laser {
  constructor(props) {
    this.fromEntity = props.fromEntity;

    this.position = vec2ToVector3(props.position);
    this.tangent = vec2ToVector3(props.vector);

    this.tangent.normalize();
    this.normal = new Vector3(-this.vector.y, this.vector.x, 0);
    this.endPoint = null;

    this.geometry = new Geometry();
    this.geometry.vertices.push(new Vector3(0, 0, 0));
    this.geometry.vertices.push(new Vector3(0, 0, 0));
    this.geometry.vertices.push(new Vector3(0, 0, 0));
    this.geometry.vertices.push(new Vector3(0, 0, 0));
    this.geometry.faces.push(new Face3(0, 1, 2));
    this.geometry.faces.push(new Face3(1, 2, 3));

    this.material = new MeshBasicMaterial({
      color: new Color(1, 0, 0),
      transparent: true,
      opacity: 0.5
    });

    this.mesh = new Mesh(
      this.geometry,
      this.material
    );
    this.mesh.visible = false;
  }
  attachToEngine(engine) {
    const { world } = engine;

    let hitAnything = false;
    const ray = new Ray({
      mode: Ray.ALL,
      from: vec2.clone(this.position),
      to: this.vector,
      callback: (result) => {
        console.log(result);
        if (result.body === null || result.body === this.body) {
          return;
        }
        hitAnything = true;
      }
    });
    const result = new RaycastResult();
    world.raycast(result, ray);
  }
  syncMeshWithScene(engine) {
    if (this.endPoint) {
      this.geometry.vertices[0]
        .multiplyScalar(0)
        .add(this.normal);
      this.geometry.vertices[1]
        .multiplyScalar(0)
        .sub(this.normal);
      this.geometry.vertices[2]
        .multiplyScalar(0)
        .add(this.tangent)
        .multiplyScalar(100)
        .add(this.normal);
      this.geometry.vertices[3]
        .multplyScalar(0)
        .add(this.tangent)
        .multiplyScalar(100)
        .sub(this.normal);
      this.mesh.visible = true;
    }
  }
}
