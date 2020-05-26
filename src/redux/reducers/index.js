import { combineReducers } from "redux";
import panesReducer from "./panes";
import scriptsReducer from "./scripts";
import statusReducer from "./status";

export default combineReducers({
  panes: panesReducer,
  scripts: scriptsReducer,
  status: statusReducer
});
