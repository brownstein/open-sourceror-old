import { NavGrid } from "./grid-to-navnodes-2";

const pathPlannerStore = [];

function handleMessage(event) {
  switch (event.data.type) {
    case "planPath":
      return planPath(event);
    case "setNavGrid":
      return setNavGrid(event);
    default:
      return;
  }
}

function planPath(event) {
  const navGrid = pathPlannerStore[0];
  if (!navGrid) {
    return;
  }

  const { id, pathPlotterArgs } = event.data;
  const result = navGrid.planPath(...pathPlotterArgs);
  self.postMessage({ id, result });
}

function setNavGrid(event) {
  pathPlannerStore[0] = NavGrid.parse(event.data.grid);
}

self.addEventListener("message", handleMessage);
