import TinyQueue from "tinyqueue";

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
    this.neighborsById = {};

    // dirty data for use in pathfinding - will be stale after each run but
    // shouldn't effect anything
    this.dirtyPrevNavNode = null;
    this.dirtyNavDistance = 0;
    this.dirtyNavCost = 0;
  }
  connectTo(neighbor) {
    this.neighborsById[neighbor.id] = neighbor;
    neighbor.neighborsById[this.id] = this;
  }
  disconnectFrom(neighbor) {
    delete this.neighborsById[neighbor.id];
    delete neighbor.neighborsById[this.id];
  }
  isConnectedTo(neighbor) {
    return !!this.neighborsById[neighbor.id];
  }
  merge(neighbor) {
    this.xMin = Math.min(this.xMin, neighbor.xMin);
    this.xMax = Math.max(this.xMax, neighbor.xMax);
    this.yMin = Math.min(this.yMin, neighbor.yMin);
    this.yMax = Math.max(this.yMax, neighbor.yMax);
    Object.keys(neighbor.neighborsById).forEach(nextDoorNeighborId => {
      const nextDoorNeighbor = neighbor.neighborsById[nextDoorNeighborId];
      delete nextDoorNeighbor.neighborsById[neighbor.id];
      this.neighborsById[nextDoorNeighborId] = nextDoorNeighbor;
    });
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
    this.xScale = xScale;
    this.columns = [];
    this.navNodesById = {};
  }
  addNavNode(node) {
    if (this.navNodesById[node.id]) {
      return;
    }
    this.navNodesById[node.id] = node;
    const xMin = Math.floor(node.xMin / this.xScale);
    const xMax = Math.floor(node.xMax / this.xScale - 1);
    let inserted = false;
    for (let x = xMin; x <= xMax; x++) {
      let column = this.columns[x];
      if (!column) {
        column = [];
        this.columns[x] = column;
      }
      for (let ci = 0; ci < column.length; ci++) {
        const currentNode = column[ci];
        if (currentNode.yMin >= node.yMax) {
          column.splice(ci, 0, node);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        column.push(node);
      }
    }
  }
  getNodeByCoordinates(x, y) {
    const columnIndex = Math.floor(x / this.xScale);
    const column = this.columns[columnIndex];
    if (!column) {
      return null;
    }
    for (let ci = 0; ci < column.length; ci++) {
      const navArea = column[ci];
      if (navArea.contains(x, y)) {
        return navArea;
      }
    }
    return null;
  }
  plotPath(startX, startY, endX, endY, jumpHeight) {
    // TODO: implement jump
    // TODO: test heuristic

    // if we can't get a clean start, we're done
    const startNode = this.getNodeByCoordinates(startX, startY);
    if (!startNode) {
      return null;
    }
    // base case - we're already in the right area
    if (startNode.contains(endX, endY)) {
      return [startNode];
    }

    // A* heuristic function for nodes
    function costHeuristic(navNode) {
      let prevCost = navNode.dirtyPrevNavNode ?
        navNode.dirtyPrevNavNode.dirtyNavDistance :
        0;
      return prevCost + navNode.distanceFrom(endX, endY);
    }

    // node comparator
    function cmpNodes(a, b) {
      return a.dirtyNavCost - b.dirtyNavCost;
    }

    const visitedNodeIds = {};
    const frontier = new TinyQueue([], cmpNodes);

    startNode.dirtyPrevNavNode = null;
    startNode.dirtyNavDistance = 0;
    startNode.dirtyNavCost = costHeuristic(startNode);
    frontier.push(startNode);
    visitedNodeIds[startNode.id] = true;

    // search expansion helper
    function expand(prevNode, nextNode) {
      if (visitedNodeIds[nextNode.id]) {
        return;
      }
      visitedNodeIds[nextNode.id] = true;
      nextNode.dirtyPrevNavNode = prevNode;
      nextNode.dirtyNavDistance = prevNode.dirtyNavDistance +
        nextNode.traversalDistanceCost();
      nextNode.dirtyNavCost = costHeuristic(nextNode);
      frontier.push(nextNode);
    }

    // while the frontier has available nodes, expand the search
    let finalNode = null;
    while (frontier.peek()) {
      const nextNode = frontier.pop();
      if (nextNode.contains(endX, endY)) {
        finalNode = nextNode;
        break;
      }
      Object.keys(nextNode.neighborsById).forEach(id => {
        const neighbor = nextNode.neighborsById[id];
        expand(nextNode, neighbor);
      });
    }

    // if we found a path, we're done
    if (finalNode) {
      let node = finalNode;
      let i = 0;
      const path = [node];
      while (node.dirtyPrevNavNode && i++ < 1000) {
        node = node.dirtyPrevNavNode;
        path.push(node);
      }
      path.reverse();
      return path;
    }

    // no path found
    return null;
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
  for (let x = 0; x < gridWidth; x++) {
    blocks[x] = [];
  }
  for (let bi = 0; bi < sourceGridArr.length; bi++) {
    const sourceVal = sourceGridArr[bi];
    const x = bi % gridWidth;
    const y = Math.floor(bi / gridWidth);
    const column = blocks[x];
    if (!sourceVal) {
      column.push(true);
      continue;
    }
    const tileDef = tileDefsById[sourceVal - 1];
    if (!tileDef) {
      column.push(true);
      continue;
    }
    if (useTileTypes.includes(tileDef.type)) {
      column.push(null);
    }
    else {
      column.push(true);
    }
  }

  // convert blocks entries into references to nav areas
  for (let x = 0; x < blocks.length; x++) {
    const column = blocks[x];
    let currentNavArea = null;
    for (let y = 0; y < gridHeight; y++) {
      const blockValue = column[y];
      if (!blockValue) {
        currentNavArea = null;
        continue;
      }
      if (currentNavArea) {
        currentNavArea.yMax = y;
        column[y] = currentNavArea;
        continue;
      }
      currentNavArea = new NavArea(x, x, y, y);
      column[y] = currentNavArea;
    }
  }

  // merge navAreas that are next to each other
  for (let x = 1; x < blocks.length; x++) {
    const column = blocks[x];
    const prevColumn = blocks[x - 1];
    for (let y = 0; y < gridHeight; y++) {
      const navBlock = column[y];
      const prevNavBlock = prevColumn[y];
      if (!navBlock || !prevNavBlock) {
        continue;
      }
      if (
        (navBlock.yMin === prevNavBlock.yMin) &&
        (navBlock.yMax === prevNavBlock.yMax)
      ) {
        prevNavBlock.merge(navBlock);
        for (let yy = y; yy <= navBlock.yMax; yy++) {
          column[yy] = prevNavBlock;
        }
        y = navBlock.yMax;
      }
      else {
        navBlock.connectTo(prevNavBlock);
      }
    }
  }

  // use an object hash map to get the final nav areas
  const navAreasById = {};
  for (let x = 0; x < blocks.length; x++) {
    const column = blocks[x];
    for (let y = 0; y < column.length; y++) {
      const block = column[y];
      if (block) {
        navAreasById[block.id] = block;
      }
    }
  }

  // convert to an array and update bboxes to reflect game-scale coordinates
  const navNodesArray = Object.keys(navAreasById).map(k => navAreasById[k]);
  const navGrid = new NavGrid(tileSize);
  navNodesArray.forEach(n => {
    n.xMin = n.xMin * tileSize;
    n.xMax = (n.xMax + 1) * tileSize;
    n.yMin = n.yMin * tileSize;
    n.yMax = (n.yMax + 1) * tileSize;
    navGrid.addNavNode(n);
  });

  return navGrid;
}
