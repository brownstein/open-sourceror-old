import {
  NavGrid,
  NavBlockage,
} from "./navigation-grid";

export class AsyncNavGrid extends NavGrid {
  constructor(grid, gridScale, gridWidth, gridHeight) {
    super(grid, gridScale, gridWidth, gridHeight);

    this.worker = null;
    this.workerCallbackId = 0;
    this.workerCallbacksById = {};
  }
  async initNavWorker() {
    if (this.worker) {
      return this.worker;
    }
    const workerModule = await import("./navigation.worker");
    const Worker = workerModule.default;

    this.worker = new Worker();
    this.workerCallbacksById = {};

    this.worker.onmessage = event => {
      const { id } = event.data;
      const callback = this.workerCallbacksById[id];
      if (callback) {
        delete this.workerCallbacksById[id];
        callback(event);
      }
    };

    this.worker.postMessage({ type: "setNavGrid", grid: this.serialize() });
  }
  asyncPlanPath(...pathPlotterArgs) {
    const planId = this.workerCallbackId++;
    return new Promise((resolve, reject) => {
      const { worker, workerCallbacksById } = this;

      function callback(event) {
        const { result } = event.data;
        resolve(result);
      };

      this.workerCallbacksById[planId] = callback;

      setTimeout(() => {
        delete this.workerCallbacksById[planId];
      }, 30);

      worker.postMessage({
        type: "planPath",
        id: planId,
        pathPlotterArgs
      });
    });
  }
  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
  static parse(src) {
    return new AsyncNavGrid(
      src.grid.map(v => v.map(b => b ? NavBlockage.parse(b) : b)),
      src.gridScale,
      src.gridWidth,
      src.gridHeight
    );
  }
  static createNavGridForTileGrid(
    sourceGridArr,
    gridWidth,
    tileSize,
    tileSet,
    useTileTypes = ["ground", "oneWayPlatform"]
  ) {
    const {
      grid,
      gridScale,
      gridHeight
    } = NavGrid.createNavGridForTileGrid(
      sourceGridArr,
      gridWidth,
      tileSize,
      tileSet,
      useTileTypes
    );
    return new AsyncNavGrid(grid, gridScale, gridWidth, gridHeight);
  }
}
