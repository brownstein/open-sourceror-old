import {
  Color,
  DoubleSide,
  Face3,
  Geometry,
  Object3D,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector3
} from "three";

export class TargetingReticle {
  constructor(viewport) {
    this.engine = null;
    this.viewport = viewport;

    this.blockOutlineGeom = new Geometry();
    this.blockOutlineGeom.vertices.push(new Vector3(-1, -1, 0));
    this.blockOutlineGeom.vertices.push(new Vector3(1, -1, 0));
    this.blockOutlineGeom.vertices.push(new Vector3(1, 1, 0));
    this.blockOutlineGeom.vertices.push(new Vector3(-1, 1, 0));
    this.blockOutlineGeom.faces.push(new Face3(0, 1, 2));
    this.blockOutlineGeom.faces.push(new Face3(0, 2, 3));

    this.blockOutlineMaterial = new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      opacity: 0.25,
      color: new Color(
        0.5 + 0.5 * Math.random(),
        0.5 + 0.5 * Math.random(),
        0.5 + 0.5 * Math.random()
      )
    });

    this.blockOutlineMesh = new Mesh(
      this.blockOutlineGeom,
      this.blockOutlineMaterial
    );

    this.blockOutlineMesh.scale.multiplyScalar(8);

    this.lineConnectionGeom = new Geometry();
    this.lineConnectionGeom.vertices.push(new Vector3(0, 0, 0));
    this.lineConnectionGeom.vertices.push(new Vector3(0, 0, 0));
    this.lineConnectionGeom.vertices.push(new Vector3(0, 0, 0));
    this.lineConnectionGeom.vertices.push(new Vector3(0, 0, 0));
    this.lineConnectionGeom.faces.push(new Face3(0, 1, 2));
    this.lineConnectionGeom.faces.push(new Face3(0, 2, 3));

    this.lineConnectionMaterial = new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      opacity: 0.5,
      color: new Color(
        0.5 + 0.5 * Math.random(),
        0.5 + 0.5 * Math.random(),
        0.5 + 0.5 * Math.random()
      )
    });

    this.lineConnectionMesh = new Mesh(
      this.lineConnectionGeom,
      this.lineConnectionMaterial
    );

    this.mesh = new Object3D();
    this.mesh.add(this.blockOutlineMesh);
    this.mesh.add(this.lineConnectionMesh);
    this.mesh.position.z = 30;

    this.viewport.mouseEventEmitter.on("mousedown", () => {
      const scale = 16 + 8;
      this.blockOutlineMesh.scale.x = scale;
      this.blockOutlineMesh.scale.y = scale;
    });

    this.viewport.mouseEventEmitter.on("mouseup", () => {
      const scale = 8;
      this.blockOutlineMesh.scale.x = scale;
      this.blockOutlineMesh.scale.y = scale;
    });
  }
  syncMeshWithViewport(viewport) {
    const { engine } = this;
    this.blockOutlineMesh.position.copy(viewport.mouseSceneCoordinates);
    this.blockOutlineMesh.position.x = Math
      .floor(this.blockOutlineMesh.position.x / 16) * 16 + 8;
    this.blockOutlineMesh.position.y = Math
      .floor(this.blockOutlineMesh.position.y / 16) * 16 + 8;

    const playerPosition = engine.controllingEntity.mesh.position;
    const posDiff = viewport.mouseSceneCoordinates
      .clone()
      .sub(playerPosition);
    const posDiffLength = posDiff
      .length();
    const posDiffTangent = posDiff
      .clone()
      .normalize();
    const posDiffNormal = new Vector3(
      -posDiffTangent.y,
      posDiffTangent.x,
      0
    );

    this.lineConnectionMesh.position.copy(playerPosition);
    this.lineConnectionGeom.vertices[0]
      .multiplyScalar(0)
      .add(posDiffNormal);
    this.lineConnectionGeom.vertices[1]
      .multiplyScalar(0)
      .sub(posDiffNormal);
    this.lineConnectionGeom.vertices[2]
      .multiplyScalar(0)
      .add(posDiffTangent)
      .multiplyScalar(posDiffLength)
      .sub(posDiffNormal);
    this.lineConnectionGeom.vertices[3]
      .multiplyScalar(0)
      .add(posDiffTangent)
      .multiplyScalar(posDiffLength)
      .add(posDiffNormal);
    this.lineConnectionGeom.verticesNeedUpdate = true;
  }
  setVisible(visible) {
    this.mesh.visible = visible;
  }
}
