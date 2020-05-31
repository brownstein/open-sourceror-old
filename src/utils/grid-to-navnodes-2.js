import Queue from "queue-fifo";
import PriorityQueue from "tinyqueue";
import { vec2 } from "p2";

const EMPTY_SPACE = 0;
const BLOCKED_SPACE = 1;
const ONE_WAY_PLATFORM = 2;
const NAV_NODE = 3;

const WALK = "walk";
const JUMP = "jump";
const JUMP_TO = "jump_to";
const FALL = "fall";
const FALL_TO = "fall_to";

const DEBUG = false;

// PLANS:
// - complete jump engine [doneish]
// - complete motion planning engine
// clean everything up

// /**
//  * Directional link class - represents a link between two NavAreas that may be
//  * uni-directional or bi-directional
//  */
// class NavLink {
//   static _id = 1;
//   static DISCONNECTED = 0;
//   static WALK_TO = 1;
//   static FALL_TO = 2;
//   static JUMP_TO = 3;
//   constructor(a, b) {
//     this.id = NavLink._id++;
//     this.a = a;
//     this.b = b;
//     this.aToBMethod = NavLink.DISCONNECTED;
//     this.bToAMethod = NAVLink.DISCONNECTED;
//     this.aToBCost = Infinity;
//     this.bToACost = Infinity;
//   }
//   setABConnectionMethodAndCost(method, cost) {
//     this.aToBMethod = method;
//     this.aToBCost = cost;
//   }
//   setBAConnectionMethodAndCost(method, cost) {
//     this.bToAMethod = method;
//     this.bToACost = cost;
//   }
//   setConnectionMethodAndCost(start, method, cost) {
//     if (start === this.a) {
//       this.setABConnectionMethodAndCost(method, cost);
//     }
//     else {
//       this.setBAConnectionMethodAndCost(method, cost);
//     }
//   }
//   getConnectionMethodAndCost(start) {
//     if (start === this.a) {
//       return [this.aToBMethod, this.aToBCost];
//     }
//     else {
//       return [this.bToAMethod, this.bToACost];
//     }
//   }
//   getOtherNode(start) {
//     return start === this.a ? this.b : this.a;
//   }
// }


export class CollisionBBox {
  constructor(xSize, ySize) {
    this.x = 0;
    this.y = 0;
    this.xSize = xSize;
    this.ySize = ySize;
    this.xMin = -xSize * 0.5;
    this.xMax = xSize * 0.5;
    this.yMin = -ySize * 0.5;
    this.yMax = ySize * 0.5;
  }
  containsPoint(point) {
    return (
      this.x + this.xMin <= point.x &&
      this.x + this.xMax >= point.x &&
      this.y + this.yMin <= point.y &&
      this.y + this.yMax >= point.y
    );
  }
  intersects(other) {
    if (this.x + this.xMin > other.x + other.xMax) {
      return false;
    }
    if (this.x + this.xMax < other.x + other.xMin) {
      return false;
    }
    if (this.y + this.yMin > other.y + other.yMax) {
      return false;
    }
    if (this.y + this.yMax < other.y + other.yMin) {
      return false;
    }
    return true;
  }
  clone() {
    const bbox = new CollisionBBox(this.xSize, this.ySize);
    bbox.x = this.x;
    bbox.y = this.y;
    return bbox;
  }
  centerOnPoint(pos) {
    this.x = pos.x;
    this.y = pos.y;
  }
}

class NavBlockage extends CollisionBBox {
  constructor(xSize, ySize, type) {
    super(xSize, ySize);
    this.type = type;
  }
}

// const LINK_WALK = 1;
// const LINK_JUMP = 2;
//
// class NavNode {
//   constructor() {
//     this.type = NAV_NODE;
//     this.linksById = {};
//   }
//   linkBidirectionally(other) {
//
//   }
//   linkUnidirectionally(other) {
//
//   }
// }

class JumpPlanningCache {
  constructor(resolution = 1, vResolution = 0.1) {
    this.resolution = resolution;
    this.invResolution = 1 / resolution;
    this.vResolution = vResolution;
    this.invVResolution = 1 / vResolution;
    this.cache = {};
  }
  _key(x, y, vx, vy) {
    const rx = Math.round(x * this.invResolution);
    const ry = Math.round(y * this.invResolution);
    const rvx = Math.round(vx * this.invVResolution);
    const rvy = Math.round(vy * this.invVResolution);
    return `${rx}-${ry}-${rvx}-${rvy}`;
  }
  get(x, y, vx, vy) {
    return this.cache[this._key(x, y, vx, vy)] || null;
  }
  add(node) {
    const { x, y, vx, vy } = node;
    this.cache[this._key(x, y, vx, vy)] = node;
  }
}

class JumpPlanningNode {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.chainLength = 0;
    this.prevNode = null;
    this.distCost = 0;
    this.cost = 0;
  }
  copyLocationToBBox(bbox) {
    bbox.x = this.x;
    bbox.y = this.y;
  }
  distanceFrom(other) {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
  velocityCost(other, gravity) {
    let x = this.x;
    let y = this.y;
    const vx = this.vx;
    let vy = this.vy;
    let leastDistToPoint = Infinity;
    for (let t = 0; t < 120; t++) {
      x += vx;
      vy += gravity;
      y += vy;
      const dist = Math.abs(other.x - x) + Math.abs(other.y - y); // cheap
      if (dist < leastDistToPoint) {
        leastDistToPoint = dist;
      }
    }

    return leastDistToPoint;
  }
}

class NavPlanningCache {
  constructor(resolution = 16) {
    this.resolution = resolution;
    this.invResolution = 1 / resolution;
    this.cache = {};
  }
  _key(x, y, vx, vy) {
    const rx = Math.round(x * this.invResolution);
    const ry = Math.round(y * this.invResolution);
    return `${rx}-${ry}`;
  }
  get(x, y) {
    return this.cache[this._key(x, y)] || null;
  }
  add(node) {
    const { x, y } = node;
    this.cache[this._key(x, y)] = node;
  }
}

class NavPlanningNode {
  constructor(x, y, action) {
    this.x = x;
    this.y = y;
    this.action = action;
    this.chainLength = 0;
    this.prevNode = null;
    this.distCost = 0;
    this.cost = 0;
  }
  distanceFrom(other) {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
}

export class MovementCapabilities {
  constructor(
    xAcceleration,
    maxJumpVelocity,
    gravity
  ) {
    this.xAcceleration = xAcceleration;
    this.maxJumpVelocity = maxJumpVelocity;
    this.gravity = gravity;
  }
}

class NavGrid {
  constructor(grid, gridScale, gridWidth, gridHeight) {
    this.grid = grid;
    this.gridScale = gridScale;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    global.JumpPlanningCache = JumpPlanningCache;
    global.CollisionBBox = CollisionBBox;
  }
  /**
   * Checks a given bounding box for intersection with the grid
   */
  checkBBox(bbox, ignoreOneWay) {
    const gxMin = Math.max(
      0,
      Math.floor((bbox.x + bbox.xMin) / this.gridScale)
    );
    const gxMax = Math.min(
      this.gridWidth - 1,
      Math.floor((bbox.x + bbox.xMax) / this.gridScale)
    );
    const gyMin = Math.max(
      0,
      Math.floor((bbox.y + bbox.yMin) / this.gridScale)
    );
    const gyMax = Math.min(
      this.gridHeight - 1,
      Math.floor((bbox.y + bbox.yMax) / this.gridScale)
    );
    for (let x = gxMin; x <= gxMax; x++) {
      const column = this.grid[x];
      for (let y = gyMin; y <= gyMax; y++) {
        const block = column[y];
        if (block === null) {
          continue;
        }
        if (bbox.intersects(block) && (
          block.type === BLOCKED_SPACE ||
          (block.type === ONE_WAY_PLATFORM && !ignoreOneWay)
        )) {
          return true;
        }
      }
    }
    return false;
  }
  fitBBoxIntoGrid(bbox, leeway = 8, ignoreOneWay = true) {
    const { gridScale } = this;
    const { x: rawX, y: rawY, xMin, xMax, yMin, yMax } = bbox;
    const width = xMax - xMin;
    const height = yMax - yMin;

    bbox.x = Math.floor(rawX / gridScale + 0.5) * gridScale;
    bbox.y = Math.floor(rawY / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.y = Math.floor((rawY - leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX - leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX + leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.y = Math.floor((rawY + leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX - leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = Math.floor((rawX + leeway) / gridScale + 0.5) * gridScale;
    if (!this.checkBBox(bbox)) {
      return true;
    }

    bbox.x = rawX;
    bbox.y = rawY;
    return false;
  }
  /**
   * Attempts to plan a jump through the grid
   */
  planJump(
    xStart,
    yStart,
    xEnd,
    yEnd,
    xSize,
    ySize,
    xAccelleration, // stepwise accelleration on the X dimension
    maxJumpVelocity, // maximum jump velocity,
    gravity // raw gravity from engine
  ) {
    const { grid, gridScale, gridWidth, gridHeight } = this;

    // TODO: clean this up if used
    // const startBBox = new CollisionBBox(xSize, ySize);
    // startBBox.x = xStart;
    // startBBox.y = yStart;
    // this.fitBBoxIntoGrid(startBBox);
    // xStart = startBBox.x;
    // yStart = startBBox.y;

    // end position as object reference
    const endPos = {
      x: xEnd,
      y: yEnd
    };

    const resolution = 1;
    const accResolution = xAccelleration / 2;

    const planCache = new JumpPlanningCache(resolution, accResolution);
    const entityBBox = new CollisionBBox(xSize - 0.1, ySize - 0.1);
    const entityExpandedBBox = new CollisionBBox(xSize + 4, ySize + 4);

    const initialNode = new JumpPlanningNode(
      Math.round(xStart / gridScale),
      Math.round(yStart / gridScale),
      0,
      0
    );

    const frontier = new PriorityQueue([], (a, b) => a.cost - b.cost);

    for (let vx = -xAccelleration; vx <= xAccelleration; vx += accResolution) {
      for (let vy = -maxJumpVelocity; vy < 0; vy += accResolution) {
        const initialNode = new JumpPlanningNode(xStart, yStart, vx, vy);
        initialNode.cost =
          initialNode.distanceFrom(endPos) +
          initialNode.velocityCost(endPos, gravity);
        frontier.push(initialNode);
      }
    }

    const checker = this;
    function expand(prevNode, x, y, vx, vy) {
      if (
        x < 0 ||
        x >= gridWidth * gridScale ||
        y < 0 ||
        y >= gridHeight * gridScale
      ) {
        return;
      }
      if (planCache.get(x, y, vx, vy)) {
        return;
      }
      const nextNode = new JumpPlanningNode(x, y, vx, vy);
      nextNode.prevNode = prevNode;
      nextNode.distCost = prevNode.distCost + nextNode.distanceFrom(prevNode);
      nextNode.cost = nextNode.distCost +
        nextNode.distanceFrom(endPos) +
        nextNode.velocityCost(endPos, gravity);
      entityExpandedBBox.x = nextNode.x;
      entityExpandedBBox.y = nextNode.y;
      if (checker.checkBBox(entityExpandedBBox, vy < 0)) {
        nextNode.cost += 1;
      }
      nextNode.chainLength = prevNode.chainLength + 1;
      planCache.add(nextNode);
      frontier.push(nextNode);
    }

    let cycles = 0;
    let finalNode = null;
    while (frontier.peek() && cycles++ < 2000) {
      const nextNode = frontier.pop();
      entityBBox.x = nextNode.x;
      entityBBox.y = nextNode.y;
      if (entityBBox.containsPoint(endPos)) {
        finalNode = nextNode;
        break;
      }
      if (this.checkBBox(entityBBox, nextNode.vy < 0)) {
        continue;
      }
      const vy = nextNode.vy + gravity;
      const y = nextNode.y + vy;
      for (let dvx = -xAccelleration; dvx <= xAccelleration; dvx += accResolution) {
        const vx = nextNode.vx + dvx;
        const x = nextNode.x + vx;
        expand(nextNode, x, y, vx, vy);
      }
    }

    if (!finalNode) {
      return null;
    }

    const nodePath = [];
    let node = finalNode;
    while (node !== null) {
      nodePath.push(node);
      node = node.prevNode;
    }

    nodePath.reverse();
    return nodePath;
  }
  getPossibleJumps(
    entityBBox,
    plotXSpread,
    plotYSpread,
    moveCapabilities,
    planningCache
  ) {
    const { gridScale } = this;
    const { x: xStart, y: yStart, xSize, ySize } = entityBBox;
    const {
      xAcceleration,
      maxJumpVelocity,
      gravity
    } = moveCapabilities;
    const xMin = Math.max(0, entityBBox.x - plotXSpread);
    const xMax = Math.min(
      this.gridWidth * this.gridScale,
      entityBBox.x + plotXSpread
    );
    const yMin = Math.max(0, entityBBox.y - plotYSpread);
    const yMax = Math.min(
      (this.gridHeight - 1) * this.gridScale,
      entityBBox.y + plotYSpread
    );

    const jumpLocations = [];

    for (let x = xMin; x <= xMax; x += gridScale) {
      const gridX = Math.floor(x / this.gridWidth);
      const column = this.grid[gridX];
      for (let y = yMin; y <= yMax; y += gridScale) {
        if (planningCache.get(x, y)) {
          continue;
        }
        const gridY = Math.floor(y / this.gridHeight);
        const gridBlock = column[gridY];
        const gridBlockBelow = column[gridY + 1];
        if (gridBlock !== null || gridBlockBelow === null) {
          continue;
        }

        const jumpPath = this.planJump(
          xStart,
          yStart,
          x,
          y,
          xSize,
          ySize,
          xAcceleration,
          maxJumpVelocity,
          gravity
        );

        if (!jumpPath) {
          continue;
        }

        planningCache.add({ x, y, isJump: true });
        jumpLocations.push({ x, y });
      }
    }

    return jumpLocations;
  }
  // plotPossibleFalls(
  //   entityBBox,
  //   plotXSpread,
  //   plotYSpread,
  //   xAccelleration = 2,
  //   gravity
  // ) {
  //   const planCache = new NavPlanningCache()
  //   const { gridScale } = this;
  //   const collBBox = entityBBox.clone();
  //   let openSpotsInRow = [{
  //     x: collBBox.x,
  //     y: collBBox.y,
  //     minDX: 0,
  //     maxDX: 0,
  //     dy: 0,
  //     t: 0
  //   }];
  //   let y = entityBBox.y;
  //   let openPositions = [];
  // }
  planPath(
    xStart,
    yStart,
    xEnd,
    yEnd,
    xSize,
    ySize,
    xAcceleration,
    maxJumpVelocity,
    gravity
  ) {
    const { grid, gridScale, gridWidth, gridHeight } = this;
    const xSizeInBlocks = Math.ceil(xSize / gridScale);
    const ySizeInBlocks = Math.ceil(ySize / gridScale);

    const moveCapabilities = new MovementCapabilities(
      xAcceleration,
      maxJumpVelocity,
      gravity
    );

    // round start and end coordinates to the grid and make sure they fit
    // cleanly
    const startBBox = new CollisionBBox(xSize - 2, ySize - 2);
    startBBox.x = xStart;
    startBBox.y = yStart;
    const fitStart = this.fitBBoxIntoGrid(startBBox);
    if (!fitStart) {
      console.log("Unable to fit start location into grid");
      return null;
    }

    const endBBox = startBBox.clone();
    endBBox.x = xEnd;
    endBBox.y = yEnd;
    const fitEnd = this.fitBBoxIntoGrid(endBBox);
    if (!fitEnd) {
      console.log("Unable to fit end location into grid");
      return null;
    }

    // create a bounding box for use in collision detection
    const planningBBox = startBBox.clone();

    // create start node
    const startNode = new NavPlanningNode(startBBox.x, startBBox.y, null);
    startNode.cost = startNode.distanceFrom(endBBox) * 1.5;

    // create the cache and expansion queue
    const planCache = new NavPlanningCache(gridScale);
    const frontier = new PriorityQueue([], (a, b) => a.cost - b.cost);

    frontier.push(startNode);

    function expand(prevNode, x, y, action) {
      if (
        x < 0 ||
        x >= gridWidth * gridScale ||
        y < 0 ||
        y >= gridHeight * gridScale
      ) {
        return;
      }
      if (planCache.get(x, y) !== null) {
        return;
      }
      const nextNode = new NavPlanningNode(x, y, action);
      nextNode.prevNode = prevNode;
      nextNode.distCost = prevNode.distCost + nextNode.distanceFrom(prevNode);
      nextNode.cost = nextNode.distCost + nextNode.distanceFrom(endBBox) * 1.5;
      nextNode.chainLength = prevNode.chainLength + 1;
      planCache.add(nextNode);
      frontier.push(nextNode);
    }

    let cycles = 0;
    let finalNode = null;
    let bestNode = null;
    let bestNodeCost = Infinity;
    while (frontier.peek() && cycles++ < 2000) {
      const nextNode = frontier.pop();
      const { x, y } = nextNode;
      if (nextNode.cost < bestNodeCost) {
        bestNode = nextNode;
        bestNodeCost = nextNode.cost;
      }
      planningBBox.x = nextNode.x;
      planningBBox.y = nextNode.y;
      if (planningBBox.containsPoint(endBBox)) {
        finalNode = nextNode;
        break;
      }
      if (this.checkBBox(planningBBox, false)) {
        continue;
      }
      planningBBox.y = nextNode.y + gridScale;
      const onGround = this.checkBBox(planningBBox, false);
      if (onGround) {
        expand(nextNode, x - gridScale, y, WALK);
        expand(nextNode, x + gridScale, y, WALK);
        planningBBox.x = nextNode.x;
        planningBBox.y = nextNode.y;
        // const jumps = this.getPossibleJumps(
        //   planningBBox, 80, 80, moveCapabilities, planCache);
        // jumps.forEach(jump => {
        //   expand(nextNode, jump.x, jump.y, JUMP);
        // });
      }
      else {
        expand(nextNode, x, y + gridScale, FALL);
      }
    }

    console.log(finalNode, bestNode);
    finalNode = finalNode || bestNode;

    console.log("CYCLES", cycles);
    console.log("CACHE", planCache);

    if (!finalNode) {
      return null;
    }

    const nodePath = [];
    let node = finalNode;
    while (node !== null) {
      nodePath.push(node);
      node = node.prevNode;
    }

    nodePath.reverse();
    return nodePath;
  }
}

export function getNavGridForTileGrid(
  sourceGridArr,
  gridWidth,
  tileSize,
  tileset,
  useTileTypes=["ground", "oneWayPlatform"]
) {
  const gridHeight = sourceGridArr.length / gridWidth;

  // map tile definitions by ID for faster reference
  const tileDefsById = {};
  for (let ti = 0; ti < tileset.tiles.length; ti++) {
    const tileDef = tileset.tiles[ti];
    tileDefsById[tileDef.id] = tileDef;
  }

  // preprocess block lookup table
  const grid = [];
  for (let x = 0; x < gridWidth; x++) {
    grid[x] = [];
  }
  for (let bi = 0; bi < sourceGridArr.length; bi++) {
    const sourceVal = sourceGridArr[bi];
    const x = bi % gridWidth;
    const y = Math.floor(bi / gridWidth);
    const column = grid[x];
    if (!sourceVal) {
      column.push(null);
      continue;
    }
    const tileDef = tileDefsById[sourceVal - 1];
    if (!tileDef) {
      column.push(null);
      continue;
    }
    if (useTileTypes.includes(tileDef.type)) {
      const blockType = tileDef.type === "oneWayPlatform" ?
        ONE_WAY_PLATFORM :
        BLOCKED_SPACE;
      const block = new NavBlockage(tileSize, tileSize, blockType);
      block.x = (x + 0.5) * tileSize;
      block.y = (y + 0.5) * tileSize;
      column.push(block);
    }
    else {
      column.push(null);
    }
  }

  // swap relevant nulls for navigation nodes
  // for (let x = 0; x < gridWidth; x++) {
  //   const column = grid[x];
  //   for (let y = 0; y < gridHeight - 1; y++) {
  //     const block = column[y];
  //     const nextBlock = column[y + 1];
  //     if (nextBlock && !block) {
  //       column[y] = new NavNode(x * gridScale, y * gridScale);
  //     }
  //   }
  // }

  // stitch grid adjacencies
  // for (let x = 0; x < gridWidth - 1; x++) {
  //   const column = grid[x];
  //   const nextColumn = grid[x + 1];
  //   for (let y = 0; y < gridHeight - 1; y++) {
  //     const block = column[y];
  //     const rightBlock = nextColumn[y];
  //     if (
  //       !block ||
  //       !rightBlock ||
  //       !block.type !== NAV_NODE ||
  //       !rightBlock.type !== NAV_NODE
  //     ) {
  //       continue;
  //     }
  //   }
  // }

  // return a shiny new nagivation grid
  return new NavGrid(grid, tileSize, gridWidth, gridHeight);
}
