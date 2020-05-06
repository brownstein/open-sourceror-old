import { makeCCW, quickDecomp } from "poly-decomp";

const MAX_EDGE_ITERATION_DEPTH = 100000;
const MAX_BLOCK_ITERATION_DEPTH = 100000;

class Edge {
  constructor (x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.next = null;
    this.prev = null;
    this.merged = false;
    this.edgeSet = null;
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

class EdgeSet {
  constructor () {
    this.edges = [];
    this.isOuter = false;
    this.leftAnchor = null;
    this.rightAnchor = null;
  }
  push (edge) {
    this.edges.push(edge);
  }
}

const oppositeSides = {
  left: "right",
  top: "bottom",
  right: "left",
  bottom: "top"
};

class Block {
  constructor (x, y, size) {
    this.x = x;
    this.y = y;
    this.edges = {
      left:   new Edge(x, y + size, 0, -1),
      top:    new Edge(x, y, 1, 0),
      right:  new Edge(x + size, y, 0, 1),
      bottom: new Edge(x + size, y + size, -1, 0)
    };
    this.edges.left.prev = this.edges.bottom;
    this.edges.left.next = this.edges.top;
    this.edges.top.prev = this.edges.left;
    this.edges.top.next = this.edges.right;
    this.edges.right.prev = this.edges.top;
    this.edges.right.next = this.edges.bottom;
    this.edges.bottom.prev = this.edges.right;
    this.edges.bottom.next = this.edges.left;
    this.blockSet = null;
  }
  mergeNeighborEdge (neighbor, side) {
    const oppositeSide = oppositeSides[side];
    if (oppositeSide === undefined) {
      return;
    }
    const edge = this.edges[side];
    const neighborEdge = neighbor.edges[oppositeSide];
    if (edge !== null && neighborEdge !== null) {
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
}

export function traverseGrid(sourceGridArr, gridWidth, tileSize) {
  // fill a grid with blocks
  const blocks = [];
  const gridHeight = Math.floor(sourceGridArr.length / gridWidth);
  for (let x = 0; x < gridWidth; x++) {
    const column = [];
    blocks[x] = column;
    for (let y = 0; y < gridHeight; y++) {
      const sourceVal = sourceGridArr[x + y * gridWidth];
      const block = sourceVal ?
        new Block(x * tileSize, y * tileSize, tileSize) :
        null;
      column.push(block);
    }
  }
  // merge neighboring edges
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const block = blocks[x][y];
      if (block === null) {
        continue;
      }
      const leftNeighbor = x > 0 ? blocks[x - 1][y] : null;
      const topNeighbor = y > 0 ? blocks[x][y - 1] : null;
      if (leftNeighbor !== null) {
        block.mergeNeighborEdge(leftNeighbor, "left");
      }
      if (topNeighbor !== null) {
        block.mergeNeighborEdge(topNeighbor, "top");
      }
    }
  }
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
      const leftAnchor = { x, y };
      let rightAnchor = { x, y };
      const blockSetBlocks = [];
      const frontier = [];
      const blockSet = {
        blockSetBlocks,
        leftAnchor,
        rightAnchor,
        leftAttached: false,
        rightAttached: false
      };
      function expand(nextX, nextY) {
        if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) {
          return false;
        }
        const nextBlock = blocks[nextX][nextY];
        if (nextBlock === null || nextBlock.blockSet !== null) {
          return false;
        }
        blockSetBlocks.push(nextBlock);
        nextBlock.blockSet = blockSet;
        frontier.push([nextX, nextY, nextBlock]);
      }
      expand(x, y);
      while (frontier.length > 0) {
        const [nextX, nextY] = frontier.pop();
        expand(nextX, nextY - 1);
        expand(nextX, nextY + 1);
        expand(nextX - 1, nextY);
        const expandedRight = expand(nextX + 1, nextY);
        if (!expandedRight && nextX > rightAnchor.x) {
          rightAnchor.x = nextX;
          rightAnchor.y = nextY;
        }
      }
      if (blockSetBlocks.length) {
        blockSets.push(blockSet);
      }
    }
  }

  console.log(blockSets);

  // trace all edge loops in block set
  // connect edge loops to each other
  //

  const polygonSets = [];
  for (let bsi = 0; bsi < blockSets.length; bsi++) {
    const blockSet = blockSets[bsi];
    const blocks = blockSet.blockSetBlocks;
    const polygonSets = null;
    let isInterior = false;
    for (let bi = 0; bi < blocks.length; bi++) {
      const leftMostBlock = blocks[0];
      const leftmostEdge = block.getLeftmostEdge();
      if (!leftmostEdge.merged && leftmostEdge.edgeSet === null) {
        const polgtonSet = leftMostEdge.computeEdgeSet();
        if (isInterior) {
          let nextBlock = leftMostBlock;
        }
        else {
          isInterior = true;
        }
      }
    }

    const leftMostBlock = blocks[0];
    const leftmostEdge = leftMostBlock.getLeftmostEdge();
    leftmostEdge.computeEdgeSet();

  }

  return polygonSets;
}
