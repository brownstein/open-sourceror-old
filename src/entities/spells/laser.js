import {
  Ray,
  RaycastResult,
  vec2
} from "p2";
import {
  Color,
  DoubleSide,
  Geometry,
  Face3,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector3
} from "three";

import {
  castToVec2,
  vec2ToVector3
} from "src/p2-utils/vec2-utils";
import { EphemeralEntity } from "src/entities/base";


export class Laser {
  constructor(props) {
    this.fromEntity = props.fromEntity;

    this.startPosition = vec2ToVector3(props.position);
    this.startTangent = vec2ToVector3(props.vector);
    this.startTangent.normalize();

    this.relativePosition = new Vector3();
    this.relativePosition.add(this.startPosition);
    const entityPosition = vec2ToVector3(props.fromEntity.body.position);
    this.relativePosition.sub(entityPosition);

    this.maxBounces = 100;
    this.maxDistance = 1000;
    this.maxSegDistance = 100;
    this.segments = [];

    this.geometry = new Geometry();
    this.material = new MeshBasicMaterial({
      side: DoubleSide,
      color: new Color(1, 0, 0),
      transparent: true,
      opacity: 0.5
    });

    this.mesh = new Mesh(
      this.geometry,
      this.material
    );
    this.mesh.position.z = 20;

    this.on = props.on !== undefined ? props.on : true;
    this.mesh.visible = false;

    this.lifeSpan = 100;
  }
  attachToEngine(engine) {

  }
  _doCast() {
    const { world } = this.engine;

    let startPoint = castToVec2(this.startPosition);
    let tangent = castToVec2(this.startTangent);
    let endPoint = vec2.clone(tangent);
    vec2.scale(endPoint, endPoint, this.maxSegDistance);
    vec2.add(endPoint, startPoint, endPoint);

    let hit = false;
    let dist = 0;
    let bounces = 0;

    this.segments = [];

    while (
      !hit &&
      dist < this.maxDistance &&
      bounces < this.maxBounces
    ) {

      let closestApplicableDist = Infinity;
      let closestApplicableEntity = null;
      let closestApplicablePoint = vec2.create();
      let closestApplicableNormal = vec2.create();

      const ray = new Ray({
        mode: Ray.ALL,
        callback: result => {
          if (!result.hasHit()) {
            return;
          }
          const hitPoint = vec2.create();
          const hitBody = result.body;
          const hitNormal = result.normal;
          result.getHitPoint(hitPoint, ray);
          const hitDist = vec2.distance(startPoint, hitPoint);

          if (hitDist >= closestApplicableDist) {
            return;
          }

          const hitEntity = this.engine.getEntityByBodyId(hitBody.id);
          if (
            hitEntity === this.fromEntity ||
            hitEntity instanceof EphemeralEntity
          ) {
            return;
          }
          
          closestApplicableDist = hitDist;
          closestApplicableEntity = hitEntity;
          vec2.copy(closestApplicablePoint, hitPoint);
          vec2.copy(closestApplicableNormal, hitNormal);
        }
      });

      // sad that we have to do this - and even when we do, raycast has bugs
      vec2.copy(ray.from, startPoint);
      vec2.copy(ray.to, endPoint);
      ray.update();

      const result = new RaycastResult();
      result.reset();

      world.raycast(result, ray);

      if (closestApplicableEntity) {
        endPoint = closestApplicablePoint;
        vec2.sub(endPoint, endPoint, tangent);
        this.segments.push([
          vec2.clone(startPoint),
          vec2.clone(closestApplicablePoint)
        ]);
        dist += closestApplicableDist || 1;

        hit = true;

        // TODO: implement mirrors to actually use this
        if (!hit) {
          bounces++;
          const closestNormal = closestApplicableNormal;
          const closestTangent = vec2.create();
          closestTangent[0] = -closestNormal[1];
          closestTangent[1] = closestNormal[0];
          const relativeNormalDist = vec2.dot(closestNormal, tangent);
          const relativeTangentDist = vec2.dot(closestTangent, tangent);
          tangent[0] = -closestNormal[0] * relativeNormalDist +
            closestTangent[0] * relativeTangentDist;
          tangent[1] = -closestNormal[1] * relativeNormalDist +
            closestTangent[1] * relativeTangentDist;
          vec2.normalize(tangent, tangent);
          vec2.copy(startPoint, endPoint);
          vec2.copy(endPoint, tangent);
          vec2.scale(endPoint, endPoint, this.maxSegDistance);
          vec2.add(endPoint, startPoint, endPoint);
        }
      }
      else {
        this.segments.push([
          vec2.clone(startPoint),
          vec2.clone(endPoint)
        ]);
        dist += this.maxSegDistance;
        vec2.copy(startPoint, endPoint);
        vec2.copy(endPoint, tangent);
        vec2.scale(endPoint, endPoint, this.maxSegDistance);
        vec2.add(endPoint, startPoint, endPoint);
      }
    }
  }
  _computeGeometry() {
    this.geometry.vertices.length = 0;
    this.geometry.faces.length = 0;

    let vStart = 0;
    this.segments.forEach(([startPoint, endPoint]) => {
      const start = vec2ToVector3(startPoint);
      const end = vec2ToVector3(endPoint);

      const tangent = end.clone().sub(start).normalize();
      const normal = new Vector3(-tangent.y, tangent.x, 0);

      this.geometry.vertices.push(start.clone().sub(normal));
      this.geometry.vertices.push(start.clone().add(normal));
      this.geometry.vertices.push(end.clone().sub(normal));
      this.geometry.vertices.push(end.clone().add(normal));
      this.geometry.faces.push(new Face3(vStart + 0, vStart + 1, vStart + 2));
      this.geometry.faces.push(new Face3(vStart + 1, vStart + 2, vStart + 3));

      vStart += 4;
    });

    this.geometry.verticesNeedUpdate = true;
    this.geometry.elementsNeedUpdate = true;
  }
  onFrame(timeDelta) {
    this.startPosition = vec2ToVector3(this.fromEntity.body.interpolatedPosition);
    this.startPosition.add(this.relativePosition);
    this._doCast();
    this._computeGeometry();
    this.mesh.visible = this.on;
    this.lifeSpan -= timeDelta;
    if (this.lifeSpan <= 0) {
      this.engine.removeEntity(this);
    }
  }
}
