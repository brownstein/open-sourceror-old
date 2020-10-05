import { DndProvider } from "react-dnd";
import { ipcRenderer } from "electron";
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from "react-redux";
import { Vector2 } from "three";

// engine-level constructs
import { GameController } from "./controller";
import { EngineViewport } from "./viewport/viewport";
import CodeConsoleTabs from "./code-pane/tabs";
import LoadingScreen from "./loading-screen";
import ModalsDisplay from "./modals/modals-display";
import LoadSaveStore from "src/engine/load-save";

import { transitionToRoom } from "src/redux/actions/rooms";

// global styles
import "./game.less";

// current loading construct
var _engine = null, initialRoom = null;

function addThings(engine) {
  _engine = engine;
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

ipcRenderer.on("start-game", function() {
  _engine.store.dispatch(transitionToRoom(initialRoom || "room-1"));
});

window.onbeforeunload = function() {
  ipcRenderer.send("on-before-unload");
}

// default component for the game
export default function Game({ store }) {
  return (
    <Provider store={store}>
      <GameController addThings={addThings} store={store}>
        <div className="game">
          <LoadingScreen>
            <DndProvider backend={HTML5Backend}>
              <div className="game-viewport">
                <EngineViewport/>
              </div>
              <div className="game-code-editor">
                <CodeConsoleTabs/>
              </div>
              <ModalsDisplay/>
            </DndProvider>
          </LoadingScreen>
        </div>
      </GameController>
    </Provider>
  );
}
