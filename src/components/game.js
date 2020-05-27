import { Provider } from "react-redux";
import { Vector2 } from "three";

// engine-level constructs
import { EngineProvider } from "./engine";
import { EngineViewport } from "./viewport";
import CodeExecutor from "./code-executor";
import LoadingScreen from "./loading-screen";

// level entities
import { Player } from "src/entities/character/player";
import { Enemy } from "src/entities/character/enemy";
import { TilesetTerrain, terrainMaterial } from "src/entities/terrain";
import { RepeatingBackgroundImage } from "src/entities/background";
import { SmallBodyOfWater } from "src/entities/environment/water";
import getContactMaterials from "src/entities/contact-materials";

// level-specific constructs
import level from "src/tilesets/magic-cliffs/level2.json";
import tilesetJson from "src/tilesets/magic-cliffs/tileset.json";
import tilesetPng from "src/tilesets/magic-cliffs/PNG/tileset.png";

// level background images
import bgSky from "src/tilesets/magic-cliffs/PNG/sky.png";
import bgClouds from "src/tilesets/magic-cliffs/PNG/clouds.png";
import bgSea from "src/tilesets/magic-cliffs/PNG/sea.png";
import bgFarGrounds from "src/tilesets/magic-cliffs/PNG/far-grounds.png";

// dialogue tester
import { DialogueEntity } from "src/entities/presentational/dialogue";

// navigation meshes
import { getNavGridForTileGrid } from "src/utils/grid-to-navnodes";
import { loadTilesetForPolygonTraversal } from "src/utils/tileset-loader";

// global styles
import "./game.less";

// current room loading construct
// TODO: replace this with a room system
function addThings(engine) {

  // apply contact materials
  getContactMaterials().forEach(m => engine.world.addContactMaterial(m));

  // load entities in the level
  level.layers.forEach(l => {
    if (l.type === "objectgroup") {
      l.objects.forEach(o => {
        switch (o.type) {
          case "playerStart": {
            const player = new Player({
              position: [o.x, o.y]
            });
            engine.addEntity(player);
            engine.followEntity(player);
            engine.setControllingEntity(player);

            const dialogue = new DialogueEntity(new Vector2(o.x, o.y));
            engine.addEntity(dialogue);

            break;
          }
          case "enemyStart": {
            const enemy = new Enemy({
              position: [o.x, o.y]
            });
            engine.addEntity(enemy);
            break;
          }
          case "water": {
            const water = new SmallBodyOfWater({
              position: {
                x: o.x + o.width / 2,
                y: o.y + o.height / 2
              },
              width: o.width,
              height: o.height
            });
            engine.addEntity(water);
            break;
          }
          default:
            break;
        }
      })
    }
  });

  // add the map
  const terrain = new TilesetTerrain(level, tilesetJson, tilesetPng);
  terrain.getEntities().forEach(e => {
    engine.addEntity(e);
    engine.expandSceneToFitEntity(e);
  });

  // add the background images
  const sky = new RepeatingBackgroundImage(bgSky, {
    wrapX: true,
    extendX: true,
    extendY: true
  });
  engine.addEntity(sky);
  engine.cameraTrackEntity(sky);

  const clouds = new RepeatingBackgroundImage(bgClouds, {
    wrapX: true,
    extendX: true,
    moveParallax: true,
    parallaxCenter: new Vector2(0, -60),
    layer: 1
  });
  engine.addEntity(clouds);
  engine.cameraTrackEntity(clouds);

  const sea = new RepeatingBackgroundImage(bgSea, {
    wrapX: true,
    extendX: true,
    extendY: true,
    moveParallax: true,
    parallaxCenter: new Vector2(0, 64),
    layer: 2,
    parallaxCoefficient: 0.2
  });
  engine.addEntity(sea);
  engine.cameraTrackEntity(sea);

  const farGrounds = new RepeatingBackgroundImage(bgFarGrounds, {
    moveParallax: true,
    parallaxCenter: new Vector2(100, 100),
    layer: 3,
    extendY: true,
    pixelScale: 3,
    parallaxCoefficient: 0.4
  });
  engine.addEntity(farGrounds);
  engine.cameraTrackEntity(farGrounds);

  // experiment with nav meshes
  const primaryLayer = level.layers.find(l => l.name === "primary");
  const tileSet = loadTilesetForPolygonTraversal(tilesetJson, tilesetPng);
  const navGrid = getNavGridForTileGrid(
    primaryLayer.data,
    primaryLayer.width,
    16,
    tileSet
  );

  // test nav grid
  console.log(navGrid);
  console.log(navGrid.getNodeByCoordinates(0, 0));
  console.log(navGrid.plotPath(1, 1, 10, 1, 40));
  console.log(navGrid.plotPath(1, 1, 500, 1, 40));
  console.log(navGrid.plotPath(1, 1, 1000, 1, 40));

  // when everything is loaded, constrain the room to ensure that things (such
  // as the player ) can't leave
  engine.on("everythingReady", () => engine.constrainRoom());
}

// default component for the game
export default function Game({ store }) {
  return (
    <Provider store={store}>
      <EngineProvider addThings={addThings}>
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
