import { combineReducers } from "redux";
import panesReducer from "./panes";

export default combineReducers({
  panes: panesReducer
});
