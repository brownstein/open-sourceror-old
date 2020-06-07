import { Vector2, Vector3 } from "three";

/**
 * Accepts either an array or an object representing 2D coordinates and
 * produces an array - useful for sanitizing player input from scripts
 */
export function castToVec2(src) {
  if (Array.isArray(src) || src instanceof Float32Array) {
    if (src.length === 2) {
      return src;
    }
    else {
      return [src[0], src[1] || 0];
    }
  }
  if (src && src.x) {
    return [src.x, src.y || 0];
  }
  return [0, 0];
}

export function vec2ToVector2(src) {
  return new Vector2(src[0], src[1]);
}

export function vec2ToVector3(src) {
  return new Vector3(src[0], src[1], 0);
}
