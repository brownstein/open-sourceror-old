import Queue from "queue-fifo";
import PriorityQueue from "tinyqueue";

/**
 * Directional link class - represents a link between two NavAreas that may be
 * uni-directional or bi-directional
 */
class NavLink {
  static _id = 1;
  static DISCONNECTED = 0;
  static WALK_TO = 1;
  static FALL_TO = 2;
  static JUMP_TO = 3;
  constructor(a, b) {
    this.id = NavLink._id++;
    this.a = a;
    this.b = b;
    this.aToBMethod = NavLink.DISCONNECTED;
    this.bToAMethod = NAVLink.DISCONNECTED;
    this.aToBCost = Infinity;
    this.bToACost = Infinity;
  }
  setABConnectionMethodAndCost(method, cost) {
    this.aToBMethod = method;
    this.aToBCost = cost;
  }
  setBAConnectionMethodAndCost(method, cost) {
    this.bToAMethod = method;
    this.bToACost = cost;
  }
  setConnectionMethodAndCost(start, method, cost) {
    if (start === this.a) {
      this.setABConnectionMethodAndCost(method, cost);
    }
    else {
      this.setBAConnectionMethodAndCost(method, cost);
    }
  }
  getConnectionMethodAndCost(start) {
    if (start === this.a) {
      return [this.aToBMethod, this.aToBCost];
    }
    else {
      return [this.bToAMethod, this.bToACost];
    }
  }
  getOtherNode(start) {
    return start === this.a ? this.b : this.a;
  }
}

/**
 * Nav area class
 */
class NavArea {
  static _id = 1;
  constructor(xMin, xMax, yMin, yMax) {
    this.id = NavArea._id++;
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.linksByNeighborId = {};

    // dirty data for use in pathfinding - will be stale after each run but
    // shouldn't effect anything
    this.dirtyPrevNavNode = null;
    this.dirtyNavDistance = 0;
    this.dirtyNavCost = 0;
  }
  connectTo(neighbor, toThis = WALK_TO, toNeighbor = WALK_TO) {
    let link;
    if (this.linksByNeighborId[neighbor.id]) {
      link = this.linksByNeighborId[neighbor.id];
      link.toA = toThis;
      link.toB = toNeighbor;
    }
    else {
      link = new NavLink(this, neighbor, toThis, toNeighbor);
      this.linksByNeighborId[neighbor.id] = link;
    }
    neighbor.linksByNeighborId[this.id] = link;
  }
  disconnectFrom(neighbor) {
    delete this.linksByNeighborId[neighbor.id];
    delete neighbor.linksByNeighborId[this.id];
  }
  isConnectedTo(neighbor) {
    return !!this.linksByNeighborId[neighbor.id];
  }
  merge(neighbor) {
    this.xMin = Math.min(this.xMin, neighbor.xMin);
    this.xMax = Math.max(this.xMax, neighbor.xMax);
    this.yMin = Math.min(this.yMin, neighbor.yMin);
    this.yMax = Math.max(this.yMax, neighbor.yMax);
  }
  contains(x, y) {
    return (
      this.xMin <= x &&
      this.xMax >= x &&
      this.yMin <= y &&
      this.yMax >= y
    );
  }
  getCenter() {
    return [
      (this.xMax + this.xMin) * 0.5,
      (this.yMax + this.yMin) * 0.5
    ];
  }
  distanceFrom(x, y) {
    if (this.contains(x, y)) {
      return 0;
    }
    if (
      this.xMin <= x &&
      this.xMax >= x
    ) {
      return Math.min(
        Math.abs(y - this.yMax),
        Math.abs(y - this.yMin)
      );
    }
    if (
      this.yMin <= y &&
      this.yMax >= y
    ) {
      return Math.min(
        Math.abs(x - this.xMin),
        Math.abs(x - this.xMax)
      );
    }
    let leastDistance = Infinity;
    [
      [this.xMin, this.yMin],
      [this.xMin, this.yMax],
      [this.xMax, this.yMin],
      [this.xMax, this.yMax]
    ]
    .forEach(([cornerX, cornerY]) => {
      const dx = x - cornerX;
      const dy = y - cornerY;
      leastDistance = Math.min(
        leastDistance,
        Math.sqrt(dx * dx + dy * dy)
      );
    });
    return leastDistance;
  }
  traversalDistanceCost() {
    // this works for now because we want to favor open areas, but in a later
    // version we might want to look at the crosswise traversal distance through
    // a given node from A -> node -> B
    return Math.min(
      Math.abs(this.xMax - this.xMin),
      Math.abs(this.yMax - this.yMin)
    );
  }
}

class NavGrid {
  constructor(xScale) {
    this.navNodesById = {};
  }
}


function _tarverseSurfaceTop(blocks, startX, startY) {

  const frontier = new Queue();
  function expand(nextX, nextY) {

  }

  while (!frontier.isEmpty()) {
    const [nextX, nextY] = frontier.dequeue();

    expand(nextX - 1, nextY);
    expand(nextX + 1, nextY);
    expand(nextX, nextY - 1);
    expand(nextX, nextY + 1);
  }
}


export function getNavGridForTileGrid(
  sourceGridArr,
  gridWidth,
  tileSize,
  tileset,
  useTileTypes=["ground"]
) {
  const gridHeight = sourceGridArr.length / gridWidth;

  // map tile definitions by ID for faster reference
  const tileDefsById = {};
  for (let ti = 0; ti < tileset.tiles.length; ti++) {
    const tileDef = tileset.tiles[ti];
    tileDefsById[tileDef.id] = tileDef;
  }

  // preprocess block lookup table
  const blocks = [];
  const nodes = [];
  for (let x = 0; x < gridWidth; x++) {
    blocks[x] = [];
    nodes[x] = [];
  }
  for (let bi = 0; bi < sourceGridArr.length; bi++) {
    const sourceVal = sourceGridArr[bi];
    const x = bi % gridWidth;
    const y = Math.floor(bi / gridWidth);
    const column = blocks[x];
    const nodeColumn = nodes[x];
    nodeColumn.push(null);
    if (!sourceVal) {
      column.push(false);
      continue;
    }
    const tileDef = tileDefsById[sourceVal - 1];
    if (!tileDef) {
      column.push(false);
      continue;
    }
    if (useTileTypes.includes(tileDef.type)) {
      column.push(true);
    }
    else {
      column.push(false);
    }
  }

  // add connected grid nodes for each consecutive platform area
  for (let y = 0; y < gridHeight - 1; y++) {
    let currentNode = null;
    for (let x = 0; x < gridWidth; x++) {
      const blockValue = blocks[x][y];
      const blockValueBelow = blocks[x][y + 1];
      // if we've got an open space with an occupied space below, we've got a
      // good candidate for a grid value
      if (!gridValue && gridValueBelow) {
        // if (currentNode) {
        //   currentNode.xMax++;
        //   nodes[x][y] = currentNode;
        // }
        // else {
        currentNode = new NavArea(x, x, y, y);
        nodes[x][y] = currentNode;
        // }
      }
      else {
        currentNode = null;
      }
    }
  }

  console.log('NODES GRID', nodes);

  // connect blocks on surfaces
  for (let x = 0; x < blocks.length; x++) {
    const column = blocks[x];
    let currentNavArea = null;
    for (let y = 0; y < column.length; y++) {
      const value = column[y];
      

    }
  }





}
