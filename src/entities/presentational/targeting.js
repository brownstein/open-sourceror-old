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
  constructor() {
    this.engine = null;

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
    
    this.blockOutlineMesh.position.z = 30;
    this.blockOutlineMesh.scale.multiplyScalar(8);

    this.mesh = new Object3D();
    this.mesh.add(this.blockOutlineMesh);
  }
  syncMeshWithViewport(viewport) {
    this.mesh.position.copy(viewport.mouseSceneCoordinates);
    this.mesh.position.x = Math.floor(this.mesh.position.x / 16) * 16 + 8;
    this.mesh.position.y = Math.floor(this.mesh.position.y / 16) * 16 + 8;
  }
  setVisible(visible) {
    this.mesh.visible = visible;
  }
}
