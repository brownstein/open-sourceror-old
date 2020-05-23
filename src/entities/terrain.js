import {
  Box3,
  Color,
  DoubleSide,
  Face3,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Object3D,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import {
  Body,
  Convex,
  Material,
  vec2
} from "p2";
import getThreeJsObjectForP2Body from "../p2-utils/get-threejs-mesh";
import { traverseTileGrid } from "../utils/grid-to-polygon";
import { loadTileset } from "../utils/tileset-loader";

const DEBUG_TERRAIN = false;

export const terrainMaterial = new Material();

export class Terrain {
  constructor() {
    this.terrainEntities = [];
  }
  getEntities() {
    return this.terrainEntities;
  }
}

export class TerrainEntity {
  constructor() {
    this.body = null;
    this.mesh = null;
  }
  syncMeshWithBody () {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
}

export class TilesetTerrain extends Terrain {
  constructor(levelJson, tilesetJson, tilesetPng) {
    super();

    this.tileset = loadTileset(tilesetJson, tilesetPng);
    this.level = levelJson;
    this.levelPolygonsAndTiles = traverseTileGrid(
      levelJson.layers[0].data,
      levelJson.layers[0].width,
      levelJson.tilewidth,
      this.tileset
    );

    const textureLoader = new TextureLoader();

    this.terrainEntities = this.levelPolygonsAndTiles.map(t => {
      return new TilesetTerrainEntity(
        t.polygons,
        t.tiles,
        textureLoader
      );
    });

    this.ready = false;
    this._readyPromise = this._init();
  }
  async _init() {
    await Promise.all(this.terrainEntities.map(e => e._readyPromise));
    this.ready = true;
  }
}

export class TilesetTerrainEntity extends TerrainEntity {
  constructor(polygons, tiles, textureLoader) {
    super();

    this.sourcePolygons = polygons;
    this.sourceTiles = tiles;

    this.body = new Body({
      mass: 0,
      isStatic: true,
      friction: 0.9,
      position: [0, 0]
    });
    if (polygons) {
      polygons.forEach(polygon => {
        const convex = new Convex({ vertices: polygon.map(({x, y}) => [x, y])});
        const cm = vec2.create();
        for(let j = 0; j !== convex.vertices.length; j++){
          const v = convex.vertices[j];
          vec2.sub(v, v, convex.centerOfMass);
        }
        vec2.scale(cm, convex.centerOfMass, 1);

        convex.material = terrainMaterial;
        this.body.addShape(convex, cm);
      });
    }

    this.mesh = new Object3D();
    if (DEBUG_TERRAIN) {
      const debugMesh = getThreeJsObjectForP2Body(this.body);
      this.mesh.add(debugMesh);
    }

    if (tiles && tiles.length) {
      const texture = textureLoader.load(tiles[0].tile.srcImage);
      texture.magFilter = NearestFilter;
      const tileMat = new MeshBasicMaterial({
        side: DoubleSide,
        map: texture,
        transparent: true,
        alphaTest: 0.1
      });
      const tileGeom = new Geometry();
      tiles.forEach(tileInstance => {
        const tile = tileInstance.tile;
        let z = 0.6;
        if (tile.depthBias) {
          z = tile.depthBias;
        }
        tileGeom.vertices.push(new Vector3(tileInstance.x, tileInstance.y, z));
        tileGeom.vertices.push(new Vector3(tileInstance.x + tile.srcWidth, tileInstance.y, z));
        tileGeom.vertices.push(new Vector3(tileInstance.x + tile.srcWidth, tileInstance.y + tile.srcHeight, z));
        tileGeom.vertices.push(new Vector3(tileInstance.x, tileInstance.y + tile.srcHeight, z));
        const vtxIndex = tileGeom.vertices.length - 4;
        tileGeom.faces.push(new Face3(vtxIndex + 0, vtxIndex + 1, vtxIndex + 2));
        tileGeom.faces.push(new Face3(vtxIndex + 0, vtxIndex + 2, vtxIndex + 3));
        [
          [[0, 0], [1, 0], [1, 1]],
          [[0, 0], [1, 1], [0, 1]]
        ].forEach(faceUVs => {
          tileGeom.faceVertexUvs[0].push(faceUVs.map(([x, y]) =>
          new Vector2(
            (tile.srcX + (x * tile.srcWidth)) / tile.srcImageWidth,
            1-(tile.srcY + (y * tile.srcHeight)) / tile.srcImageHeight,
          )));
        });
      });
      const tileMesh = new Mesh(tileGeom, tileMat);
      tileMesh.position.z = 0.5;
      this.mesh.add(tileMesh);
    }

    this.ready = false;
    this._readyPromise = this._init();
  }
  async _init() {
    // TODO: wait for textures to load here
    this.ready = true;
  }
}
