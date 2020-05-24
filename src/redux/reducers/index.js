import { combineReducers } from "redux";
import panesReducer from "./panes";
import scriptsReducer from "./scripts";

export default combineReducers({
  panes: panesReducer,
  scripts: scriptsReducer
});
