import { ipcRenderer } from "electron";
import { Provider } from "react-redux";
import { Vector2 } from "three";

// engine-level constructs
import { GameController } from "./controller";
import { EngineViewport } from "./viewport/viewport";
import CodeConsoleTabs from "./code-pane/tabs";
import LoadingScreen from "./loading-screen";
import PauseMenu from "./pause-menu/pause-menu";
import LoadSaveStore from "src/engine/load-save";

import { transitionToRoom } from "src/redux/actions/rooms";

// global styles
import "./game.less";

// current loading construct
var _engine = null, initialRoom = null;

function addThings(engine) {
  _engine = engine;
  _engine.store.dispatch(transitionToRoom(initialRoom || "tutorial-1"));
}

ipcRenderer.on("set-room", function(event, data) {
  const { room } = data;
  initialRoom = room;
  
  if (_engine && room) {
    _engine.store.dispatch(transitionToRoom(room));
  }
});

ipcRenderer.on("load-game", function() {
  const saveStore = new LoadSaveStore();
  if (!saveStore.saveFileExists) {
    throw new Error("no save file present");
  }

  const data = saveStore.load();

  const { room } = data;
  initialRoom = room;

  if (_engine && room) {
    _engine.store.dispatch(transitionToRoom(room));
  }
});

// default component for the game
export default function Game({ store }) {
  return (
    <Provider store={store}>
      <GameController addThings={addThings} store={store}>
        <div className="game">
          <LoadingScreen>
            <div className="game-viewport">
              <EngineViewport/>
            </div>
            <div className="game-code-editor">
              <CodeConsoleTabs/>
            </div>
            <PauseMenu/>
          </LoadingScreen>
        </div>
      </GameController>
    </Provider>
  );
}
