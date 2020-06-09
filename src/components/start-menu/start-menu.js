import { useContext } from "react";
import { connect } from "react-redux";
import { ControllerContext } from "../controller";

export default function StartMenu () {

  return <div className="start-menu">
    <div className="upper">
      <h1>Open Sourceror</h1>
    </div>
    <div className="lower">
      <button>New Game</button>
      <button>Load Game</button>
      <button>Quit</button>
    </div>
  </div>;
}
