import Queue from "queue-fifo";
import PriorityQueue from "tinyqueue";
import { vec2 } from "p2";

const EMPTY_SPACE = 0;
const BLOCKED_SPACE = 1;
const ONE_WAY_PLATFORM = 2;

const DEBUG = false;

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

/**
 * Nav area class
 */
class CollisionBBox {
  constructor(xSize, ySize) {
    this.x = 0;
    this.y = 0;
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
}

class NavBlockage extends CollisionBBox {
  constructor(xSize, ySize, type) {
    super(xSize, ySize);
    this.type = type;
  }
}

class NavPlanningCache {
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

class NavPlanningNode {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
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
  velocityCost(other) {
    const xDiff = other.x - this.x;
    const yDiff = other.y - this.y;
    return Math.abs(xDiff - this.vx) + Math.abs(yDiff - this.vy);
  }
}

class NavGrid {
  constructor(grid, gridScale, gridWidth, gridHeight) {
    this.grid = grid;
    this.gridScale = gridScale;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    global.NavPlanningCache = NavPlanningCache;
    global.CollisionBBox = CollisionBBox;
  }
  /**
   * Checks a given bounding box for intersection with the grid
   */
  checkBBox(bbox) {
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
        if (bbox.intersects(block)) {
          return true;
        }
      }
    }
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
    gravity // stepwise gravity,
  ) {
    const { grid, gridScale, gridWidth, gridHeight } = this;

    const startPos = {
      x: xStart,
      y: yStart
    };

    const endPos = {
      x: xEnd,
      y: yEnd
    };

    const resolution = 1;
    const accResolution = 0.5;

    const planCache = new NavPlanningCache(1, 0.5);
    const entityBBox = new CollisionBBox(xSize - 0.1, ySize - 0.1);

    const initialNode = new NavPlanningNode(
      Math.round(xStart / gridScale),
      Math.round(yStart / gridScale),
      0,
      0
    );

    const frontier = new PriorityQueue([], (a, b) => a.cost - b.cost);

    for (let vx = -xAccelleration; vx <= xAccelleration; vx += accResolution) {
      for (let vy = -maxJumpVelocity; vy < 0; vy += accResolution) {
        const initialNode = new NavPlanningNode(xStart, yStart, vx, vy);
        initialNode.cost = initialNode.distanceFrom(endPos);
        frontier.push(initialNode);
      }
    }

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
      const nextNode = new NavPlanningNode(x, y, vx, vy);
      nextNode.prevNode = prevNode;
      nextNode.distCost = prevNode.distCost + nextNode.distanceFrom(prevNode);
      nextNode.cost = nextNode.distCost +
        nextNode.distanceFrom(endPos) +
        nextNode.velocityCost(endPos);
      planCache.add(nextNode);
      frontier.push(nextNode);
    }

    DEBUG && console.log('INITIAL FRONTIER', frontier.length);

    let cycles = 0;
    let finalNode = null;
    while (frontier.peek() && cycles++ < 1000) {
      const nextNode = frontier.pop();
      entityBBox.x = nextNode.x;
      entityBBox.y = nextNode.y;
      if (entityBBox.containsPoint(endPos)) {
        finalNode = nextNode;
        break;
      }
      if (this.checkBBox(entityBBox)) {
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

    DEBUG && console.log("CACHE", planCache);
    DEBUG && console.log('CYCLES', cycles);

    const nodePath = [];
    let node = finalNode;
    while (node !== null) {
      nodePath.push(node);
      node = node.prevNode;
    }

    nodePath.reverse();
    DEBUG && console.log("PATH");
    DEBUG && nodePath.forEach(n => console.log(n.x, n.y, n.vx, n.vy));

    return finalNode;
  }
}

function simulateJump(platGrid, startX, startY, maxXDist, maxYUp, maxYDown) {

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
  const obstructionGrid = [];
  for (let x = 0; x < gridWidth; x++) {
    obstructionGrid[x] = [];
  }
  for (let bi = 0; bi < sourceGridArr.length; bi++) {
    const sourceVal = sourceGridArr[bi];
    const x = bi % gridWidth;
    const y = Math.floor(bi / gridWidth);
    const column = obstructionGrid[x];
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
      const block = new NavBlockage(tileSize, tileSize, tileDef.type);
      block.x = (x + 0.5) * tileSize;
      block.y = (y + 0.5) * tileSize;
      column.push(block);
    }
    else {
      column.push(null);
    }
  }

  return new NavGrid(obstructionGrid, tileSize, gridWidth, gridHeight);
}
