import { combineReducers } from "redux";
import panesReducer from "./panes";
import scriptsReducer from "./scripts";
import statusReducer from "./status";
import saveStateReducer from "./save-state";
import roomsReducer from "./rooms";

export default combineReducers({
  panes: panesReducer,
  scripts: scriptsReducer,
  status: statusReducer,
  saveState: saveStateReducer,
  rooms: roomsReducer
});
