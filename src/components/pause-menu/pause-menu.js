import { useContext, useState, useEffect } from "react";
import { ControllerContext } from "../controller";
import ItemGrid from "./item-grid";

import "./pause-menu.less";

export default function PauseMenu () {
  const ctx = useContext(ControllerContext);
  const { running, unPause } = ctx;
  if (running) {
    return null;
  }
  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <h2>Paused</h2>
        <button onClick={unPause}>resume</button>
        <div className="content">
          <ItemGrid/>
        </div>
      </div>
    </div>
  );
}
