
class TileSetEntity {
  // static TOP = 1;
  // static BOTTOM = 2;
  // static LEFT = 3;
  // static RIGHT = 4;
  // static INFILL = 5;
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }
}

class LinearGenerator {
  constructor(x, y, infill) {
    this.x = x;
    this.y = y;
    this.vx = Math.round(Math.random() * 2 - 1);
    this.vy = Math.round(Math.random() * 2 - 1);
    this.size = Math.ceil(Math.random() * 2 + 1);
    this.infill = infill;
  }
  fillGridAtStep(grid) {
    const { vx, vy } = this;
    const steps = Math.max(vx, vy);
    const dx = vx / steps;
    const dy = vy / steps;
    const sizeWindowLeft = -Math.floor(this.size / 2);
    const sizeWindowRight = Math.ceil(this.size / 2);
    // draw a line from the current location extending to the location plus
    // dx, dy
    for (let t = 0; t < steps; t++) {
      const x = Math.floor(this.x + dx * t);
      const y = Math.floor(this.y + dy * t);
      for (let xx = sizeWindowLeft; xx < sizeWindowRight; xx++) {
        for (let yy = sizeWindowLeft; yy < sizeWindowRight; yy++) {
          if (x + xx >= 0 && x + xx < grid.length && y + yy >= 0 && y + yy < grid[0].length) {
            grid[x + xx][y + yy] = this.infill;
          }
        }
      }
    }
  }
  moveToNextLocation() {
    this.x += this.vx;
    this.y += this.vy;
  }
  adjustVelocity() {
    this.vx += Math.round(Math.random() * 2 - 1);
    this.vy += Math.round(Math.random() * 2 - 1);
  }
}

function recursivelyGenerateTerrainBlob(
  grid,
  xStart,
  yStart,
  size,
  dx = 0,
  dy = 0
) {
  if (size <= 0) {
    return;
  }
  for (let x = xStart; x < xStart + size; x++) {
    for (let y = yStart; y < yStart + size; y++) {
      if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length) {
        grid[x][y] = true;
      }
    }
  }
  recursivelyGenerateTerrainBlob(
    grid,
    xStart + dx,
    yStart + dy,
    size - 1,
    Math.round(Math.random() * 2 - 1),
    Math.round(Math.random() * 2 - 1)
  );
}

function generateTerrain(xSize, ySize, tileSet) {

  // initialize grid
  const grid = [];
  for (let x = 0; x < xSize; x++) {
    const column = [];
    grid[x] = column;
    for (let y = 0; y < ySize; y++) {
      column[y] = null;
    }
  }

  // create uneven ground
  let baseLineHeight = 10;
  let baseLineNextWidth = 5;
  for (let x = 0; x < xSize; x++) {
    if (baseLineNextWidth-- <= 0) {
      baseLineHeight = 5 + Math.floor(Math.random() * 5);
      baseLineNextWidth = 2 + Math.floor(Math.random() * 20);
    }
    for (let y = ySize - baseLineHeight; y < ySize; y++) {
      grid[x][y] = true;
    }
  }

  // create some platforms that stick out
  const platformGenerators = [];
  const platformGeneratorCount = Math.sqrt(xSize * ySize) * 0.1;
  for (let i = 0; i < platformGeneratorCount; i++) {
    const platGenerator = new LinearGenerator(
      Math.floor(Math.random() * xSize),
      Math.floor(Math.random() * ySize),
      true
    );
    platformGenerators.push(platGenerator);
    const platformLength = Math.random() * 100;
    for (let t = 0; t < platformLength; t++) {
      platGenerator.fillGridAtStep(grid);
      platGenerator.moveToNextLocation();
      platGenerator.adjustVelocity();
    }
  }

  // create some terrain blobs
  const terrainBlobCount = Math.sqrt(xSize * ySize) * 0.2;
  for (let b = 0; b < terrainBlobCount; b++) {
    recursivelyGenerateTerrainBlob(
      grid,
      Math.floor(Math.random() * xSize),
      Math.floor(Math.random() * ySize),
      Math.ceil(Math.random() * 10)
    );
  }

  // create some tunnels through those platforms
  const tunnelGenerators = [];
  const tunnelGeneratorCount = Math.sqrt(xSize * ySize) * 0.1;
  for (let i = 0; i < tunnelGeneratorCount; i++) {
    const tunnelGenerator = new LinearGenerator(
      Math.floor(Math.random() * xSize),
      Math.floor(Math.random() * ySize),
      null
    );
    tunnelGenerators.push(tunnelGenerator);
    const tunnelLength = Math.random() * 100;
    for (let t = 0; t < tunnelLength; t++) {
      tunnelGenerator.fillGridAtStep(grid);
      tunnelGenerator.moveToNextLocation();
      tunnelGenerator.adjustVelocity();
    }
  }

  // log the grid to console
  let lines = [];
  for (let y = 0; y < ySize; y++) {
    let line = "";
    for (let x = 0; x < xSize; x++) {
      if (grid[x][y]) {
        line += "X";
      }
      else {
        line += " ";
      }
    }
    lines.push(line);
  }
  const outputString = lines.join("\n");
  console.log(outputString);
}

generateTerrain(80, 20);
