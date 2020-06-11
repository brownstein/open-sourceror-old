import { combineReducers } from "redux";
import panesReducer from "./panes";
import scriptsReducer from "./scripts";
import statusReducer from "./status";
import saveStateReducer from "./save-state";
import roomsReducer from "./rooms";
import inventoryReducer from "./inventory";

export default combineReducers({
  panes: panesReducer,
  scripts: scriptsReducer,
  status: statusReducer,
  saveState: saveStateReducer,
  rooms: roomsReducer,
  inventory: inventoryReducer
});
