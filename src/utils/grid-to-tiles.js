export function getTilesForDecals(
  sourceGridArr,
  gridWidth,
  tileSize,
  tileset
) {

  // map tile definitions by ID for faster reference
  const tileDefsById = {};
  for (let ti = 0; ti < tileset.tiles.length; ti++) {
    const tileDef = tileset.tiles[ti];
    tileDefsById[tileDef.id] = tileDef;
  }

  // for each value in the source array, generate a decal definition
  const allTiles = [];
  for (let gi = 0; gi < sourceGridArr.length; gi++) {
    const gridValue = sourceGridArr[gi];
    if (!gridValue) {
      continue;
    }
    const tileDef = tileDefsById[gridValue - 1];
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
