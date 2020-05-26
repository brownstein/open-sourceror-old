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
import { loadTilesetForPolygonTraversal } from "../utils/tileset-loader";
import { traverseTileGrid } from "../utils/grid-to-polygons";
import { getTilesForDecals } from "../utils/grid-to-tiles";

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
    this.isTerrain = true;
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

    this.tileset = loadTilesetForPolygonTraversal(tilesetJson, tilesetPng);
    this.level = levelJson;

    // identify the primary layer
    let primaryLayerIndex = 0;
    for (let li = 0; li < levelJson.layers.length; li++) {
      const layer = levelJson.layers[li];
      if (layer.type !== "tilelayer") {
        continue;
      }
      if (layer.name === "primary") {
        primaryLayerIndex = li;
        break;
      }
    }
    const primaryLayer = levelJson.layers[primaryLayerIndex];

    // get polygons and their attached tiles
    this.levelPolygonsAndTiles = traverseTileGrid(
      primaryLayer.data,
      primaryLayer.width,
      levelJson.tilewidth,
      this.tileset,
      ['ground', 'oneWayPlatform']
    );

    const textureLoader = new TextureLoader();

    // create terrain entities
    this.terrainEntities = this.levelPolygonsAndTiles.map(t => {
      return new TilesetTerrainEntity(
        t.polygons,
        t.tiles,
        textureLoader,
        t.blockType
      );
    });

    // create decal layers
    for (let li = 0; li < levelJson.layers.length; li++) {
      if (li === primaryLayerIndex) {
        continue;
      }
      const layer = levelJson.layers[li];
      if (layer.type !== "tilelayer") {
        continue;
      }
      const decals = getTilesForDecals(
        layer.data,
        layer.width,
        levelJson.tilewidth,
        this.tileset
      );
      if (decals.length) {
        const decalsEntity = new TilesetDecalLayer(
          decals,
          textureLoader
        );
        decalsEntity.mesh.position.z = 4 * (li - primaryLayerIndex);
        this.terrainEntities.push(decalsEntity);
      }
    }

    this.ready = false;
    this._readyPromise = this._init();
  }
  async _init() {
    await Promise.all(this.terrainEntities.map(e => e._readyPromise));
    this.ready = true;
  }
}

export class TilesetTerrainEntity extends TerrainEntity {
  constructor(polygons, tiles, textureLoader, blockType = "ground") {
    super();

    this.sourcePolygons = polygons;
    this.sourceTiles = tiles;

    this.isOneWayPlatform = blockType === "oneWayPlatform";
    this.oneWayPlatformTracking = [];

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

        // collide with everything
        convex.collisionGroup = -1;
        convex.collisionMask = -1;

        this.body.addShape(convex, cm);
      });
    }

    this.mesh = new Object3D();
    if (DEBUG_TERRAIN) {
      const debugMesh = getThreeJsObjectForP2Body(this.body);
      this.mesh.add(debugMesh);
    }

    this.ready = false;
    this.readyPromise = this._init(tiles, textureLoader);
  }
  async _init(tiles, textureLoader) {
    if (tiles && tiles.length) {
      const texture = await textureLoader.loadAsync(tiles[0].tile.srcImage);
      texture.magFilter = NearestFilter;
      const tileMat = new MeshBasicMaterial({
        side: DoubleSide,
        map: texture,
        transparent: true,
        opacity: DEBUG_TERRAIN ? 0.75 : 1,
        // to swap this off, we have to use separate meshes for each Z index
        // to deal with the fact that three.js's face sorting is geometry-
        // internal
        alphaTest: 0.1
      });
      const tileGeom = new Geometry();
      tiles.forEach(tileInstance => {
        const tile = tileInstance.tile;
        let z = 0.6;
        if (tile.depthBias) {
          z = tile.depthBias;
        }
        const ov = 0.01;
        tileGeom.vertices.push(new Vector3(
          tileInstance.x - ov,
          tileInstance.y - ov,
          z
        ));
        tileGeom.vertices.push(new Vector3(
          tileInstance.x - ov + tile.srcWidth + ov,
          tileInstance.y - ov,
          z
        ));
        tileGeom.vertices.push(new Vector3(
          tileInstance.x - ov + tile.srcWidth + ov,
          tileInstance.y + tile.srcHeight  + ov,
          z
        ));
        tileGeom.vertices.push(new Vector3(
          tileInstance.x - ov,
          tileInstance.y + tile.srcHeight + ov,
          z
        ));
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

    this.ready = true;
  }
  // support one-way platforms
  collisionHandler(engine, otherId, otherEntity, eq) {
    if (!this.isOneWayPlatform || !otherEntity.body || !eq) {
      return;
    }
    let normalA = eq.normalA;
    if (eq.bodyA.id === otherId) {
      normalA = [-normalA[0], -normalA[1]];
    }
    const isUpwardContact = normalA[1] < 0;
    if (!isUpwardContact) {
      eq.enabled = false;
      this.oneWayPlatformTracking.push(otherId);
    }
  }
  handleContactEquation(engine, otherId, otherEntity, eq) {
    if (!this.isOneWayPlatform || !otherEntity.body) {
      return;
    }
    if (this.oneWayPlatformTracking.includes(otherId)) {
      eq.enabled = false;
    }
  }
  endCollisionHandler(engine, otherId, otherEntity, eq) {
    if (!this.isOneWayPlatform) {
      return;
    }
    this.oneWayPlatformTracking = this.oneWayPlatformTracking.filter(id => {
      return id !== otherId;
    });
  }
}

export class TilesetDecalLayer {
  constructor (decals, textureLoader) {
    const texture = textureLoader.load(decals[0].tile.srcImage);
    texture.magFilter = NearestFilter;
    const tileMat = new MeshBasicMaterial({
      side: DoubleSide,
      map: texture,
      transparent: true,
      opacity: DEBUG_TERRAIN ? 0.25 : 1,
      // to swap this off, we have to use separate meshes for each Z index
      // to deal with the fact that three.js's face sorting is geometry-
      // internal
      alphaTest: 0.1
    });
    const tileGeom = new Geometry();
    decals.forEach(tileInstance => {
      const tile = tileInstance.tile;
      let z = 0.6;
      if (tile.depthBias) {
        z = tile.depthBias;
      }
      const ov = 0.01;
      tileGeom.vertices.push(new Vector3(
        tileInstance.x - ov,
        tileInstance.y - ov,
        z
      ));
      tileGeom.vertices.push(new Vector3(
        tileInstance.x - ov + tile.srcWidth + ov,
        tileInstance.y - ov,
        z
      ));
      tileGeom.vertices.push(new Vector3(
        tileInstance.x - ov + tile.srcWidth + ov,
        tileInstance.y + tile.srcHeight  + ov,
        z
      ));
      tileGeom.vertices.push(new Vector3(
        tileInstance.x - ov,
        tileInstance.y + tile.srcHeight + ov,
        z
      ));
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
    this.mesh = new Mesh(tileGeom, tileMat);
  }
}
