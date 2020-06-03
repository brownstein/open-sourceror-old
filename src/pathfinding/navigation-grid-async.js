import EventEmitter from "events";

import {
  NavGrid,
  NavBlockage,
} from "./naviagation-grid";

export class AsyncNavGrid extends NavGrid {
  constructor(grid, gridScale, gridWidth, gridHeight) {
    super(grid, gridScale, gridWidth, gridHeight);

    this.worker = null;
    this.workerCallbackId = 0;
    this.workerEventListener = null;
  }
  async initNavWorker() {
    if (this.worker) {
      return this.worker;
    }
    const workerModule = await import("./nav.worker");
    const Worker = workerModule.default;

    this.worker = new Worker();
    this.workerEventListener = new EventEmitter();

    this.worker.onmessage = event => {
      this.workerEventListener.emit("worker-message", event);
    };

    this.worker.postMessage({ type: "setNavGrid", grid: this.serialize() });
  }
  asyncPlanPath(...pathPlotterArgs) {
    const planId = this.workerCallbackId++;
    return new Promise((resolve, reject) => {
      const { worker, workerEventListener } = this;

      function callback(event) {
        workerEventListener.off("worker-message", callback);

        const { id, result } = event.data;
        if (id !== planId) {
          return;
        }
        resolve(result);
      }

      workerEventListener.on("worker-message", callback);
      worker.postMessage({ type: "planPath", id: planId, pathPlotterArgs });
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
    useTileTypes
  ) {
    const {
      grid
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
