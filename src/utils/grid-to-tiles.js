export function getTilesForDecals(
  sourceGridArr,
  gridWidth,
  tileSize,
  tileset
) {

  // map tile definitions by ID for faster reference
  const tileDefsById = tileset.tiles;

  // for each value in the source array, generate a decal definition
  const allTiles = [];
  for (let gi = 0; gi < sourceGridArr.length; gi++) {
    const gridValue = sourceGridArr[gi];
    if (!gridValue) {
      continue;
    }
    const tileDef = tileDefsById[gridValue];
    if (!tileDef) {
      continue;
    }
    const x = gi % gridWidth;
    const y = Math.floor(gi / gridWidth);
    allTiles.push({
      x: x * tileSize,
      y: y * tileSize,
      width: tileSize,
      height: tileSize,
      tile: tileDef
    });
  }

  return allTiles;
}
