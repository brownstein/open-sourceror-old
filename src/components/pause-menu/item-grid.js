import {
  Component,
  useState,
  useEffect,
  useRef
} from "react";
import { connect } from "react-redux";
import {
  Box3,
  Box2,
  Color,
  WebGLRenderer,
  Camera,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2
} from "three";

import Scroll from "src/entities/items/scroll";
import Medkit from "src/entities/items/medkit";

import * as items from "src/entities/items";

import "./item-grid.less";

class ItemGrid extends Component {
  constructor(props) {
    super(props);
    const { inventory } = props;

    this.iconSize = 40;

    this.webGLCanvas = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.inventoryRenderingData = {};

    const {
      inventorySprites,
      inventorySpritePromises
    } = this._mapInventoryToSprites(inventory);

    inventorySprites.map((s, i) => {
      const data = {
        sprite: s,
        canvas: null,
        context: null
      };
      this.inventoryRenderingData[i] = data;
    });

    this.state = {
      inventorySprites
    };

    this._renderFrame = this._renderFrame.bind(this);
    Promise.all(inventorySpritePromises).then(this._renderFrame);
  }
  componentDidMount() {

    // initialize an offscreen canvas element
    this.webGLCanvas = document.createElement("canvas");
    this.webGLCanvas.width = this.webGLCanvas.height = this.iconSize;

    this.ig.appendChild(this.webGLCanvas);

    // initialize three.js (including webgl context)
    this.scene = new Scene();

    this.renderer = new WebGLRenderer({
      canvas: this.webGLCanvas,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setClearAlpha(0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.iconSize, this.iconSize);

    this.camera = new OrthographicCamera(
      -10, 10,
      -10, 10,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));

    // initialize canvas 2d contexts
    this.state.inventorySprites.map((s, i) => {
      if (!s) {
        return;
      }
      const data = this.inventoryRenderingData[i];
      data.canvas.width = 40 * window.devicePixelRatio;
      data.canvas.height = 40 * window.devicePixelRatio;
      data.context = data.canvas.getContext("2d");
      data.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    });

    // call frame renderer
    // this._renderFrame();
  }
  componentWillUnmount() {
    this.renderer.dispose();
  }
  _mapInventoryToSprites(inventory,) {
    const inventorySprites = [];
    const inventorySpritePromises = [];

    inventory.forEach(itemName => {
      if (itemName) {
        const ItemClass = items[itemName];
        if (!ItemClass) {
          throw new Error("Missing item", itemName);
        }
        const itemSprite = ItemClass.getIcon();
        inventorySprites.push(itemSprite);
        inventorySpritePromises.push(itemSprite.readyPromise);
      }
      else {
        inventorySprites.push(null);
      }
    });

    return {
      inventorySprites,
      inventorySpritePromises
    };
  }
  _renderFrame() {
    this.state.inventorySprites.map((s, i) => {
      if (!s) {
        return;
      }
      const data = this.inventoryRenderingData[i];
      const { context } = data;

      this.scene.add(data.sprite.mesh);
      data.sprite.mesh.position.x = i * 16;
      this.camera.position.x = i * 16;

      this.renderer.render(this.scene, this.camera);
      const rendererContext = this.renderer.getContext();
      context.drawImage(this.webGLCanvas, 0, 0, this.iconSize, this.iconSize);
    });
  }
  render() {
    const { inventory, inventorySize } = this.props;
    const { inventoryRenderingData } = this;

    const tiles = [];

    for (let i = 0; i < inventorySize; i++) {
      const index = i;
      const data = inventoryRenderingData[index] || {};
      tiles.push(
        <div key={index} className="tile">
          <canvas ref={el => data.canvas = el}/>
        </div>
      );
    }

    return (
      <div className="item-grid" ref={el => this.ig = el}>{tiles}</div>
    );
  }
}

function mapStateToProps(state) {
  return {
    inventorySize: 8,
    inventory: [
      "Medkit",
      "Scroll",
      null,
      "Medkit",
      null,
      "Scroll"
    ]
  };
}

export default connect(mapStateToProps)(ItemGrid);
