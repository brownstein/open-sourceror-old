export function castToVec2(src) {
  if (Array.isArray(src)) {
    if (src.length === 2) {
      return src;
    }
    else {
      return [src[0], src[1] || 0];
    }
  }
  if (src.x) {
    return [src.x, src.y || 0];
  }
  return [0, 0];
}
