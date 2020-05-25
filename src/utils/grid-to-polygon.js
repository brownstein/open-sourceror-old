import {
  isSimple,
  makeCCW,
  quickDecomp,
  removeCollinearPoints
} from "poly-decomp";
import pointInPolygon from "point-in-polygon";

const MAX_EDGE_ITERATION_DEPTH = 10000; // 10000
const MAX_BLOCK_ITERATION_DEPTH = 10000; // 10000

/**
 * Internal representation of block edges
 */
class Edge {
  constructor (block, x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.next = null;
    this.prev = null;
    this.merged = false;
    this.edgeSet = null;
    this.block = block;
  }
  computeEdgeSet () {
    if (this.edgeSet) {
      return this.edgeSet;
    }
    const edges = [this];
    this.edgeSet = edges;
    let next = this.next;
    let i = 0;
    while (next !== null && next !== this && i++ < MAX_EDGE_ITERATION_DEPTH) {
      edges.push(next);
      next.edgeSet = edges;
      next = next.next;
    }
    return edges;
  }
}

/**
 * Internal representation of edge loops
 */
class EdgeSet {
  constructor () {
    this.edges = [];
  }
  traverseForward (edge) {
    this.edges = [edge];
    edge.edgeSet = this;
    let next = edge.next;
    let i = 0;
    while (next !== null && next !== edge && i++ < MAX_EDGE_ITERATION_DEPTH) {
      this.edges.push(next);
      if (next.edgeSet !== null && next.edgeSet !== this) {
        next.edgeSet.edges = [];
      }
      next.edgeSet = this;
      next = next.next;
    }
  }
  traverseBackward (edge) {
    this.edges = [edge];
    edge.edgeSet = this;
    let next = edge.prev;
    let i = 0;
    while (next !== null && next !== edge && i++ < MAX_EDGE_ITERATION_DEPTH) {
      this.edges.push(next);
      if (next.edgeSet !== null && next.edgeSet !== this) {
        next.edgeSet.edges = [];
      }
      next.edgeSet = this;
      next = next.prev;
    }
  }
  getLeftmostEdge () {
    let leftmostEdge = null;
    let minX = Infinity;
    for (let ei = 0; ei < this.edges.length; ei++) {
      const edge = this.edges[ei];
      if (edge.x < minX) {
        minX = edge.x;
        leftmostEdge = edge;
      }
    }
    return leftmostEdge;
  }
}

// opposite sides for block merging
const oppositeSides = {
  left: "right",
  top: "bottom",
  right: "left",
  bottom: "top"
};

/**
 * Base class for blocks - square blocks in a grid
 */
class AbstractBlock {
  constructor (x, y, blockType, tileDef) {
    this.x = x;
    this.y = y;
    this.blockType = blockType;
    this.tileDef = tileDef;
    this.blockSet = null;
  }
  mergeNeighborEdge (neighbor, side) {
    const oppositeSide = oppositeSides[side];
    if (oppositeSide === undefined) {
      return;
    }
    const edge = this.edges[side];
    const neighborEdge = neighbor.edges[oppositeSide];
    if (edge && neighborEdge) {
      edge.merged = true;
      neighborEdge.merged = true;
      edge.prev.next = neighborEdge.next;
      edge.next.prev = neighborEdge.prev;
      neighborEdge.prev.next = edge.next;
      neighborEdge.next.prev = edge.prev;
    }
  }
  getLeftmostEdge () {
    return this.edges.left;
  }
  getRightmostEdge () {
    return this.edges.right;
  }
  getTopmostEdge () {
    return this.edges.top;
  }
  getBottommostEdge () {
    return this.edges.bottom;
  }
}

/**
 * Basic blocks - solid squares
 */
class Block extends AbstractBlock {
  constructor (x, y, blockType, tileDef) {
    super(x, y, blockType, tileDef);
    this.edges = {
      left:   new Edge(this, x, y + 1, 0, -1),
      top:    new Edge(this, x, y, 1, 0),
      right:  new Edge(this, x + 1, y, 0, 1),
      bottom: new Edge(this, x + 1, y + 1, -1, 0)
    };
    this.edges.left.prev = this.edges.bottom;
    this.edges.left.next = this.edges.top;
    this.edges.top.prev = this.edges.left;
    this.edges.top.next = this.edges.right;
    this.edges.right.prev = this.edges.top;
    this.edges.right.next = this.edges.bottom;
    this.edges.bottom.prev = this.edges.right;
    this.edges.bottom.next = this.edges.left;
  }
}

/**
 * Polygon-based blocks for use with tile-defined polygon shapes
 */
class CustomBlock extends AbstractBlock {
  constructor (x, y, blockType, tileDef) {
    super(x, y, blockType, tileDef);
    this.edges = {};
    this.sideMapping = tileDef.sideMapping;
    const edgesByIndex = tileDef.sides.map(side => {
      const edge = new Edge(
        this,
        x + side.x,
        y + side.y,
        side.dx,
        side.dy
      );
      this.edges[side.name] = edge;
      return edge;
    });
    for (let ei = 0; ei < edgesByIndex.length; ei++) {
      const prev = edgesByIndex[ei];
      const next = edgesByIndex[(ei + 1) % edgesByIndex.length];
      prev.next = next;
      next.prev = prev;
    }
  }
  getLeftmostEdge () {
    return this.edges[this.sideMapping.left];
  }
  getRightmostEdge () {
    return this.edges[this.sideMapping.right];
  }
  getTopmostEdge () {
    return this.edges[this.sideMapping.top];
  }
  getBottommostEdge () {
    return this.edges[this.sideMapping.bottom];
  }
}

/**
 * Empty blocks used to represent decal tiles
 * still need to see if this is relevant
 */
class Decal {
  constructor (x, y, tileDef) {
    this.x = x;
    this.y = y;
    this.tileDef = tileDef;
    this.blockSet = null;
    this.traversed = false;
  }
}

/**
 * Simple angular blocks
 */
class AngleBlock extends Block {
  constructor (x, y, blockType, angleType) {
    super(x, y, blockType);
    switch (angleType) {
      case 'topright':
        delete this.edges.top;
        delete this.edges.right;
        this.edges.topright = new Edge(this, x, y, 1, 1);
        this.edges.left.next = this.edges.topright;
        this.edges.topright.prev = this.edges.left;
        this.edges.topright.next = this.edges.bottom;
        this.edges.bottom.prev = this.edges.topright;
        break;
      case 'bottomright':
        delete this.edges.right;
        delete this.edges.bottom;
        this.edges.bottomright = new Edge(this, x + 1, y, -1, 1);
        this.edges.top.next = this.edges.bottomright;
        this.edges.bottomright.prev = this.edges.top;
        this.edges.bottomright.next = this.edges.left;
        this.edges.left.prev = this.edges.bottomright;
        break;
      case 'bottomleft':
        delete this.edges.bottom;
        delete this.edges.left;
        this.edges.bottomleft = new Edge(this, x + 1, y + 1, -1, -1);
        this.edges.right.next = this.edges.bottomleft;
        this.edges.bottomleft.prev = this.edges.right;
        this.edges.bottomleft.next = this.edges.top;
        this.edges.top.prev = this.edges.bottomleft;
        break;
      case 'topleft':
        delete this.edges.left;
        delete this.edges.top;
        this.edges.topleft = new Edge(this, x, y + 1, 1, -1);
        this.edges.bottom.next = this.edges.topleft;
        this.edges.topleft.prev = this.edges.bottom;
        this.edges.topleft.next = this.edges.right;
        this.edges.right.prev = this.edges.topleft;
        break;
    }
  }
  getRightmostEdge () {
    return this.edges.right || this.edges.topright || this.edges.bottomright;
  }
  getLeftmostEdge () {
    return this.edges.left || this.edges.topleft || this.edges.bottomleft;
  }
  getTopmostEdge () {
    return this.edges.top || this.edges.topright || this.edges.topleft;
  }
  getBottommostEdge () {
    return this.edges.bottom || this.edges.bottomright || this.edges.bottomleft;
  }
}

/**
 * Internal function to merge neighboring blocks' edges
 */
function _mergeNeighbors (blocks, gridWidth, gridHeight) {
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const block = blocks[x][y];
      if (block === null) {
        continue;
      }
      const leftNeighbor = x > 0 ? blocks[x - 1][y] : null;
      const topNeighbor = y > 0 ? blocks[x][y - 1] : null;
      if (leftNeighbor !== null && leftNeighbor.blockType === block.blockType) {
        block.mergeNeighborEdge(leftNeighbor, "left");
      }
      if (topNeighbor !== null && topNeighbor.blockType === block.blockType) {
        block.mergeNeighborEdge(topNeighbor, "top");
      }
    }
  }
}

/**
 * Internal function to traverse blocks to identify connected block sets
 */
function _createBlockSets (blocks, gridWidth, gridHeight) {
  // find sets of connected blocks
  // since this is a left-to-right traversal, and therefore starting each DFS
  // traversal on each blockset's left side when encountering it for the first
  // time, we know that each blockset's fist element is it's outer perimeter
  // and any subsequent perimeters we encounter are holes
  let blockSets = [];
  for (let x = 0; x < gridWidth; x++) {
    const column = blocks[x];
    for (let y = 0; y < gridHeight; y++) {
      const block = column[y];
      if (block === null || block.blockSet !== null) {
        continue;
      }
      const blockSet = [];
      const frontier = [];
      function expand(nextX, nextY) {
        if (
          nextX < 0 || nextX >= gridWidth ||
          nextY < 0 || nextY >= gridHeight
        ) {
          return;
        }
        const nextBlock = blocks[nextX][nextY];
        if (
          nextBlock === null ||
          nextBlock.blockSet !== null ||
          nextBlock.blockType !== block.blockType
        ) {
          return;
        }
        blockSet.push(nextBlock);
        nextBlock.blockSet = blockSet;
        frontier.push([nextX, nextY, nextBlock]);
      }
      expand(x, y);
      while (frontier.length > 0) {
        const [nextX, nextY] = frontier.pop();
        expand(nextX, nextY - 1);
        expand(nextX, nextY + 1);
        expand(nextX - 1, nextY);
        expand(nextX + 1, nextY);
      }
      if (blockSet.length) {
        blockSets.push(blockSet);
      }
    }
  }
  return blockSets;
}

/**
 * Map decals to block sets
 */
function _mapDecalsToBlocksets(blockSets, decals, gridWidth, gridHeight) {
  // find decal tiles to blocksets
  const decalsWithoutBlockset = [];
  const decalsByBlockset = blockSets.map(() => []);
  let nextFrontier = [];
  function expand(nextX, nextY, anchor, bsi, r) {
    if (
      nextX < 0 || nextX >= gridWidth ||
      nextY < 0 || nextY >= gridHeight
    ) {
      return;
    }
    const decal = decals[nextX][nextY];
    if (!decal || decal.traversed) {
      return;
    }
    if (
      anchor &&
      decal.tileDef.anchor &&
      anchor !== decal.tileDef.anchor
    ) {
      return;
    }
    decal.traversed = true;
    decal.blockSet = bsi;
    if (r < 20) {
      decalsByBlockset[bsi].push(decal);
      nextFrontier.push([nextX, nextY, bsi, r]);
    }
    else {
      decalsWithoutBlockset.push(decal);
      nextFrontier.push([nextX, nextY, null, r]);
    }
  }
  for (let bsi = 0; bsi < blockSets.length; bsi++) {
    const blockSet = blockSets[bsi];
    for (let bi = 0; bi < blockSet.length; bi++) {
      const block = blockSet[bi];
      expand(block.x, block.y, null, bsi, 0);
    }
  }
  let frontier = nextFrontier;
  while (nextFrontier.length > 0) {
    nextFrontier = [];
    while (frontier.length > 0) {
      const [nextX, nextY, bsi, r] = frontier.pop();
      expand(nextX, nextY - 1, "down", bsi, r + 1);
      expand(nextX, nextY + 1, "up", bsi, r + 1);
      expand(nextX - 1, nextY, "right", bsi, r + 1);
      expand(nextX + 1, nextY, "left", bsi, r + 1);
    }
    frontier = nextFrontier;
  }
  for (let x = 0; x < decals.length; x++) {
    const column = decals[x];
    for (let y = 0; y < decals.length; y++) {
      const decal = column[y];
      if (!decal) {
        continue;
      }
      if (!decal.traversed) {
        decalsWithoutBlockset.push(decal);
      }
    }
  }
  return [decalsWithoutBlockset, decalsByBlockset];
}

/**
 * Internal function to traverse polygons for a given block set
 */
function _getPolygonsForBlockset(blocks, blockSet) {
  const edgeSets = [];
  // traverse all blocks and run edge set tracing where necessary
  // we can assume that the first traced edge represents the outer loop
  // and all subsequent traces are interior loops that need to be bridged
  for (let bi = 0; bi < blockSet.length; bi++) {
    const block = blockSet[bi];
    const leftmostEdge = block.getLeftmostEdge();
    if (!leftmostEdge) {
      continue;
    }
    if (!leftmostEdge.merged && leftmostEdge.edgeSet === null) {
      const edgeSet = new EdgeSet();
      edgeSet.traverseForward(leftmostEdge);
      edgeSets.push(edgeSet);
    }
  }

  // find outer edge sets
  const outerEdgeSets = [];
  const outerEdgeSetPolygons = [];
  for (let esi = 0; esi < edgeSets.length; esi++) {
    const edgeSet = edgeSets[esi];
    let isOuterEdgeSet = true;
    for (let oesi = 0; oesi < outerEdgeSets.length; oesi++) {
      const outerEdgeSet = outerEdgeSets[oesi];
      const outerEdgeSetPolygon = outerEdgeSetPolygons[oesi];
      for (let ei = 0; ei < edgeSet.edges.length; ei++) {
        const edge = edgeSet.edges[ei];
        if (pointInPolygon([edge.x, edge.y], outerEdgeSetPolygon)) {
          isOuterEdgeSet = false;
          break;
        }
      }
      if (isOuterEdgeSet) {
        break;
      }
    }
    if (isOuterEdgeSet) {
      outerEdgeSets.push(edgeSet);
      outerEdgeSetPolygons.push(edgeSet.edges.map(e => [e.x, e.y]));
    }
  }

  for (let esi = 1; esi < edgeSets.length; esi++) {
    // this next bit can still sometimes be buggy for angle blocks, so just
    // swollow errors and keep processing the level geometry - it probably
    // wasn't that important
    try {
      const edgeSet = edgeSets[esi];
      if (outerEdgeSets.find(s => s === edgeSet)) {
        continue;
      }
      let leftmostEdge = edgeSet.getLeftmostEdge(); // right edge of block
      let block = leftmostEdge.block;
      let x = block.x;
      const y = block.y;
      let topBlock = blocks[x][y - 1];
      let topBottomEdge;
      let bottomTopEdge;
      let prevTopBottomEdge = leftmostEdge.prev;
      let prevBottomTopEdge = leftmostEdge;
      let shouldContinue = true;
      let i = 0;
      while (i++ < MAX_EDGE_ITERATION_DEPTH) {
        topBottomEdge = topBlock.getBottommostEdge();
        bottomTopEdge = block.getTopmostEdge();
        topBottomEdge.merged = false;
        bottomTopEdge.merged = false;
        if (prevTopBottomEdge !== topBottomEdge) {
          prevTopBottomEdge.next = topBottomEdge;
          topBottomEdge.prev = prevTopBottomEdge;
        }
        if (prevBottomTopEdge !== bottomTopEdge) {
          prevBottomTopEdge.prev = bottomTopEdge;
          bottomTopEdge.next = prevBottomTopEdge;
        }
        prevTopBottomEdge = topBottomEdge;
        prevBottomTopEdge = bottomTopEdge;
        if (!block.getLeftmostEdge().merged) {
          break;
        }
        x -= 1;
        block = blocks[x][y];
        topBlock = blocks[x][y - 1];
      }
      const outerLeftmostEdge = block.getLeftmostEdge();
      const outerTopLeftEdge = outerLeftmostEdge.next;
      outerLeftmostEdge.next = bottomTopEdge;
      bottomTopEdge.prev = outerLeftmostEdge;
      outerTopLeftEdge.prev = topBottomEdge;
      topBottomEdge.next = outerTopLeftEdge;
    }
    catch (err) {
      console.error(err);
    }
  }

  // this should never happen
  if (!outerEdgeSets.length) {
    return null;
  }

  // construct polygons
  const polygons = [];
  for (let esi = 0; esi < outerEdgeSets.length; esi++) {
    const outerEdgeSet = outerEdgeSets[esi];
    outerEdgeSet.traverseForward(outerEdgeSet.edges[0]);
    const edgeSetAsPolygon = outerEdgeSet.edges.map(({ x, y }) => [x, y]);

    makeCCW(edgeSetAsPolygon);

    // we can optionaslly remove collinear points here for performance
    // removeCollinearPoints(edgeSetAsPolygon, 0.01);
    const convexPolygons = quickDecomp(edgeSetAsPolygon);
    convexPolygons.forEach(p => removeCollinearPoints(p, 0.01));
    for (let pi = 0; pi < convexPolygons.length; pi++) {
      const verts = convexPolygons[pi];
      const polygon = [];
      for (let vi = 0; vi < verts.length; vi++) {
        const vert = verts[vi];
        const [x, y] = vert;
        polygon.push({ x, y });
      }
      polygons.push(polygon);
    }
  }

  return polygons;
}

/**
 * Internal polygon rescale utility
 */
function _scalePolygons(polygons, tileSize) {
  return polygons.map(polygon => polygon.map(vtx => ({
    x: vtx.x * tileSize,
    y: vtx.y * tileSize
  })));
}

/**
 * Get tiles for a given decal array
 */
function _getTilesForDecals(decals, tileSize) {
  return decals.map(decal => ({
    x: decal.x * tileSize,
    y: decal.y * tileSize,
    width: tileSize,
    height: tileSize,
    tile: decal.tileDef
  }));
}

export function traverseSimpleGrid(sourceGridArr, gridWidth, tileSize) {
  // fill a grid with blocks
  const blocks = [];
  const gridHeight = Math.floor(sourceGridArr.length / gridWidth);
  for (let x = 0; x < gridWidth; x++) {
    const column = [];
    blocks[x] = column;
    for (let y = 0; y < gridHeight; y++) {
      const sourceVal = sourceGridArr[x + y * gridWidth];
      let block = null;
      switch (sourceVal) {
        case 1:
          block = new Block(x, y, 'base');
          break;
        case 2:
        case 3:
        case 4:
        case 5:
          const angleType = [
            'topright',
            'bottomright',
            'bottomleft',
            'topleft'
          ][sourceVal - 2];
          block = new AngleBlock(x, y, 'base', angleType);
          break;
        case 0:
        default:
          break;
      }
      column.push(block);
    }
  }

  _mergeNeighbors(blocks, gridWidth, gridHeight);
  const blockSets = _createBlockSets(blocks, gridWidth, gridHeight);

  // trace all edge loops in block set
  // connect edge loops to each other
  const polygonAndTileSets = [];
  for (let bsi = 0; bsi < blockSets.length; bsi++) {
    const blockSet = blockSets[bsi];
    const polygons = _getPolygonsForBlockset(blocks, blockSet);
    const tiles = _getTilesForBlockset(blockSet, tileSize);

    polygonAndTileSets.push({
      polygons: _scalePolygons(polygons, tileSize),
      tiles
    });
  }

  return polygonAndTileSets;
}

export function traverseTileGrid(sourceGridArr, gridWidth, tileSize, tileset,
  useTileTypes=['ground']) {

  // map tile definitions by ID for faster reference
  const tileDefsById = {};
  for (let ti = 0; ti < tileset.tiles.length; ti++) {
    const tileDef = tileset.tiles[ti];
    tileDefsById[tileDef.id] = tileDef;
  }

  // fill a grid with blocks
  const blocks = [];
  const decals = [];
  const gridHeight = Math.floor(sourceGridArr.length / gridWidth);
  for (let x = 0; x < gridWidth; x++) {
    const column = [];
    blocks[x] = column;
    const decalColumn = [];
    decals[x] = decalColumn;
    for (let y = 0; y < gridHeight; y++) {
      const sourceVal = sourceGridArr[x + y * gridWidth];
      const tileDef = tileDefsById[sourceVal - 1];
      if (!tileDef) {
        column.push(null);
        decalColumn.push(null);
        continue;
      }
      if (useTileTypes.includes(tileDef.type)) {
        if (tileDef.sides) {
          column.push(new CustomBlock(x, y, tileDef.type, tileDef));
          decalColumn.push(new Decal(x, y, tileDef));
          continue;
        }
        column.push(new Block(x, y, tileDef.type, tileDef));
        decalColumn.push(new Decal(x, y, tileDef));
        continue;
      }
      column.push(null);
      decalColumn.push(new Decal(x, y, tileDef));
    }
  }

  // link blocks that are next to eachother
  _mergeNeighbors(blocks, gridWidth, gridHeight);

  // create block sets
  const blockSets = _createBlockSets(blocks, gridWidth, gridHeight);

  // find the block set (or lack thereof) for each decal
  const [decalsWithoutBlockset, decalsByBlockset] = _mapDecalsToBlocksets(
    blockSets,
    decals,
    gridWidth,
    gridHeight
  );

  // trace all edge loops in block sets, connect edge loops to each other,
  // and add tiles
  const polygonAndTileSets = [];
  for (let bsi = 0; bsi < blockSets.length; bsi++) {
    const blockSet = blockSets[bsi];
    let polygons = blockSet && _getPolygonsForBlockset(blocks, blockSet);
    polygons = polygons && _scalePolygons(polygons, tileSize);
    const tiles = _getTilesForDecals(decalsByBlockset[bsi], tileSize);
    const blockType = blockSet[0].blockType;
    polygonAndTileSets.push({
      polygons,
      tiles,
      blockType
    });
  }

  // include free-floating decals in their own set
  if (decalsWithoutBlockset.length) {
    polygonAndTileSets.push({
      polygons: null,
      tiles: _getTilesForDecals(decalsWithoutBlockset, tileSize),
      blockType: "decal"
    });
  }

  return polygonAndTileSets;
}
