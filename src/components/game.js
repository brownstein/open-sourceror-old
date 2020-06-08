import { Provider } from "react-redux";
import { Vector2 } from "three";

// engine-level constructs
import { EngineProvider } from "./engine";
import { EngineViewport } from "./viewport";
import CodeExecutor from "./code-executor";
import LoadingScreen from "./loading-screen";

// import the first level
import Level1 from "src/rooms/intro/1";
// import Level1 from "src/rooms/test/pathfinding-tester";

// global styles
import "./game.less";

// current loading construct
function addThings(engine) {
  const level = new Level1();
  level.init(engine);
}

// default component for the game
export default function Game({ store }) {
  return (
    <Provider store={store}>
      <EngineProvider addThings={addThings} store={store}>
        <div className="game">
          <LoadingScreen>
            <div className="game-viewport">
              <EngineViewport/>
            </div>
            <div className="game-code-editor">
              <CodeExecutor/>
            </div>
          </LoadingScreen>
        </div>
      </EngineProvider>
    </Provider>
  );
}
