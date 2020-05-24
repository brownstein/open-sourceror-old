import { applyMiddleware, createStore, compose } from "redux";
import thunk from "redux-thunk";
import unhandledActions from "redux-unhandled-action";

import rootReducer from "../reducers";

export default function createGameStore() {
  const middleware = [thunk];

  // add dev middleware conditionally
  let composeEnhancers = compose;
  // middleware.push(unhandledActions);
  if (window.__DEV__) {
    if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
      composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    }
  }

  // build store
  return createStore(
    rootReducer,
    composeEnhancers(applyMiddleware(...middleware))
  );
}
