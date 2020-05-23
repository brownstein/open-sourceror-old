// patch things
import * as decomp from "poly-decomp";
window.decomp = decomp;
import regeneratorRuntime from "regenerator-runtime";

// pull in React
import ReactDom from "react-dom";
import Game from "./components/game";
import "./style.less";

const windowSize = { width: 400, height: 400 };

export default function initScene() {
  const viewContainerEl = document.getElementById("container");

  // init React
  const rContainer = document.createElement('div');
  viewContainerEl.appendChild(rContainer);
  const game = <Game/>;
  ReactDom.render(game, rContainer);
}
