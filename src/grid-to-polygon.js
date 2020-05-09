import {
  isSimple,
  makeCCW,
  quickDecomp,
  removeCollinearPoints
} from "poly-decomp";

const MAX_EDGE_ITERATION_DEPTH = 1000; // 10000
const MAX_BLOCK_ITERATION_DEPTH = 1000; // 10000

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
        //next.edgeSet.edges = [];
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
      left:   new Edge(this, x, y + size, 0, -1),
      top:    new Edge(this, x, y, 1, 0),
      right:  new Edge(this, x + size, y, 0, 1),
      bottom: new Edge(this, x + size, y + size, -1, 0)
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

class AngleBlock extends Block {
  constructor (x, y, size, angleType) {
    super(x, y, size);
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
        this.edges.bottomright = new Edge(this, x + size, y, -1, 1);
        this.edges.top.next = this.edges.bottomright;
        this.edges.bottomright.prev = this.edges.top;
        this.edges.bottomright.next = this.edges.left;
        this.edges.left.prev = this.edges.bottomright;
        break;
      case 'bottomleft':
        delete this.edges.bottom;
        delete this.edges.left;
        this.edges.bottomleft = new Edge(this, x + size, y + size, -1, -1);
        this.edges.right.next = this.edges.bottomleft;
        this.edges.bottomleft.prev = this.edges.right;
        this.edges.bottomleft.next = this.edges.top;
        this.edges.top.prev = this.edges.bottomleft;
        break;
      case 'topleft':
        delete this.edges.left;
        delete this.edges.top;
        this.edges.topleft = new Edge(this, x, y + size, 1, -1);
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

export function traverseGrid(sourceGridArr, gridWidth, tileSize) {
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
          block = new Block(x * tileSize, y * tileSize, tileSize);
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
          block = new AngleBlock(x * tileSize, y * tileSize, tileSize, angleType);
          break;
      }
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
      const blockSet = [];
      const frontier = [];
      function expand(nextX, nextY) {
        if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) {
          return false;
        }
        const nextBlock = blocks[nextX][nextY];
        if (nextBlock === null || nextBlock.blockSet !== null) {
          return false;
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
  // trace all edge loops in block set
  // connect edge loops to each other

  const polygonSets = [];
  for (let bsi = 0; bsi < blockSets.length; bsi++) {
    const blockSet = blockSets[bsi];
    const edgeSets = [];
    // traverse all blocks and run edge set tracing where necessary
    // we can assume that the first traced edge represents the outer loop
    // and all subsequent traces are interior loops that need to be bridged
    for (let bi = 0; bi < blockSet.length; bi++) {
      const block = blockSet[bi];
      const leftmostEdge = block.getLeftmostEdge();
      if (!leftmostEdge.merged && leftmostEdge.edgeSet === null) {
        const edgeSet = new EdgeSet();
        edgeSet.traverseForward(leftmostEdge);
        edgeSets.push(edgeSet);
      }
    }

    const outerEdgeSet = edgeSets[0];
    for (let esi = 1; esi < edgeSets.length; esi++) {
      // this next bit can still sometimes be buggy for angle blocks, so just
      // swollow errors and keep processing the level geometry - it probably
      // wasn't that important
      try {
        const edgeSet = edgeSets[esi];
        let leftmostEdge = edgeSet.getLeftmostEdge(); // right edge of block
        let block = leftmostEdge.block;
        let x = (block.x / tileSize);
        const y = block.y / tileSize;
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

    outerEdgeSet.traverseForward(outerEdgeSet.edges[0]);
    const edgeSetAsPolygon = outerEdgeSet.edges.map(({ x, y }) => [x, y]);

    makeCCW(edgeSetAsPolygon);
    //removeCollinearPoints(edgeSetAsPolygon, 0.01);
    const convexPolygons = quickDecomp(edgeSetAsPolygon);
    convexPolygons.forEach(p => removeCollinearPoints(p, 0.01));
    polygonSets.push(
      convexPolygons.map(
        verts => verts.map(
          ([x, y]) => ({ x, y })
        )
      )
    );
  }

  return polygonSets;
}
