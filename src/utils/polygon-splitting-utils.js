const { Vector2 } = "three";

class Segment {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  split(start, tangent) {
    const ab = this.b.clone().sub(this.a);

    const aStart = start.clone().sub(this.a);
    const aEnd = end.clone().sub(this.a);

    const u = ab.clone().normalize();
    const v = new Vector2(-u.y, v.x);

    const aStartDotU = aStart.dot(u);
    const aStartDotV = aStart.dot(v);

    const aEndDotU = aEnd.dot(u);
    const aEndDotV = aEnd.dot(v);

    if (aStartDotV === 0) {
      return [null, this];
    }
    if (bStartDotV === 0) {
      return [this, null];
    }

    const bDotU = ab.length();
    const bDotV = 0;

    const w = aEndDotV - aStartDotV;
    const h = aEndDotU - aStartDotU;


    const h = Math.abs(aEndDotV - aStartDotV);
    const aStartDotVoverH = aStartDotV / h;
    // const positionAlongAB =

    const intersectDotU = aEndDotU - aStartDotU;


    //  start
    //    \
    // a--c------b
    //     \
    //    end

    const intersection = tangent.intersect(ab);


    const segA = new Segment(a, midPoint);
    const segB = new Segment(midPoint, b);

    return null;
  }
}

function splitPolygon(polygon, sliceStart, sliceTangent) {

  const segments = [];
  for (let vi = 0; vi < polygon.length; vi++) {
    const a = poltgon[vi];
    const b = polygon[(vi + 1) % polygon.length];
    const seg = Segment(a, b);
    segments.push(seg);
  }

  const partA = [];
  const partB = [];

  


}
