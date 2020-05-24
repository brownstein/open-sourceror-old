import { ContactMaterial } from "p2";
import { Provider } from "react-redux";

// engine-level constructs
import { EngineProvider } from "./engine";
import { EngineViewport } from "./viewport";
import CodeExecutor from "./code-executor-2";

// level entities
import { Player } from "../entities/character/player";
import { Enemy } from "../entities/character/enemy";
import { TilesetTerrain, terrainMaterial } from "../entities/terrain";

// level-specific constructs
import level1 from "../tilesets/magic-cliffs/level2.json";
import tilesetJson from "../tilesets/magic-cliffs/tileset.json";
import tilesetPng from "../tilesets/magic-cliffs/PNG/tileset.png";

// global styles
import "./game.less";

// current room loading construct
// TODO: replace this with a room system
async function addThings(engine) {

  // add the player
  const player = new Player({
    position: [200, 100]
  });
  engine.addEntity(player);
  engine.followEntity(player);

  // add friction between the player and the ground
  engine.world.addContactMaterial(new ContactMaterial(
    player.body.shapes[0].material,
    terrainMaterial,
    { friction: 1 }
  ));

  // add an enemy
  const enemy = new Enemy();
  engine.addEntity(enemy);

  const terrain = new TilesetTerrain(level1, tilesetJson, tilesetPng);
  await terrain.readyPromise;

  terrain.getEntities().forEach(e => engine.addLevelEntity(e));
}

// default component for the game
export default function Game({ store }) {
  return (
    <Provider store={store}>
      <EngineProvider addThings={addThings}>
        <div className="game">
          <div className="game-viewport">
            <EngineViewport/>
          </div>
          <div className="game-code-editor">
            <CodeExecutor/>
          </div>
        </div>
      </EngineProvider>
    </Provider>
  );
}
