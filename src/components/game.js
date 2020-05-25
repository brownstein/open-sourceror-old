import { Provider } from "react-redux";

// engine-level constructs
import { EngineProvider } from "./engine";
import { EngineViewport } from "./viewport";
import CodeExecutor from "./code-executor";

// level entities
import { Player } from "../entities/character/player";
import { Enemy } from "../entities/character/enemy";
import { TilesetTerrain, terrainMaterial } from "../entities/terrain";
import getContactMaterials from "../entities/contact-materials";

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
  engine.setControllingEntity(player);

  // add friction
  getContactMaterials().forEach(m => engine.world.addContactMaterial(m));

  // add an enemy
  for (let i =0; i < 4; i++) {
    const enemy = new Enemy({
      position: [300 + i + 100, 150]
    });
    engine.addEntity(enemy);
  }

  // add the map
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
