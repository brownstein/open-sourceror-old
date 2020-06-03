import EventEmitter from "events";

import {
  NavGrid,
  NavBlockage,
  getNavGridForTileGrid as _getGrid
} from "./grid-to-navnodes-2";

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
}

export function getNavGridForTileGrid(
  sourceGridArr,
  gridWidth,
  tileSize,
  tileset,
  useTileTypes=["ground", "oneWayPlatform"]
) {
  const normalGrid = _getGrid(
    sourceGridArr,
    gridWidth,
    tileSize,
    tileset,
    useTileTypes
  );
  return AsyncNavGrid.parse(normalGrid.serialize());
}
