// patch things
import * as decomp from "poly-decomp";
window.decomp = decomp;
import regeneratorRuntime from "regenerator-runtime";

// pull in React
import ReactDom from "react-dom";
import Game from "./components/game";
import createStore from "./redux/store";
import "./style.less";

const windowSize = { width: 400, height: 400 };

export default function initScene() {
  const viewContainerEl = document.getElementById("container");
  const rContainer = document.createElement('div');
  viewContainerEl.appendChild(rContainer);

  // initialize React, redux on the container element
  const store = createStore();
  const game = <Game store={store}/>;
  ReactDom.render(game, rContainer);
}
