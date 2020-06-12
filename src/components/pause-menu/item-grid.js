import {
  Component,
  useState,
  useEffect,
  useRef
} from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend'
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

import { moveItemInInventory } from "src/redux/actions/inventory";

import Scroll from "src/entities/items/scroll";
import Medkit from "src/entities/items/medkit";

import * as items from "src/entities/items";
import "./item-grid.less";

class ItemGrid extends Component {
  constructor(props) {
    super(props);
    const { inventory } = props;

    this.dpr = window.devicePixelRatio;
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

    // initialize three.js (including webgl context)
    this.scene = new Scene();

    this.renderer = new WebGLRenderer({
      canvas: this.webGLCanvas,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setClearAlpha(0);
    this.renderer.setPixelRatio(this.dpr);
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
      data.canvas.width = 40 * this.dpr;
      data.canvas.height = 40 * this.dpr;
      data.context = data.canvas.getContext("2d");
      data.context.scale(this.dpr, this.dpr);
    });
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
  _moveItem() {
    return false;
  }
  render() {
    const { inventory, inventorySize } = this.props;
    const { inventoryRenderingData } = this;

    const tiles = [];

    for (let i = 0; i < inventorySize; i++) {
      const index = i;
      const data = inventoryRenderingData[index] || {};
      tiles.push(
        <ItemTile key={index} id={index}>
          <canvas ref={el => data.canvas = el}/>
        </ItemTile>
      );
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="item-grid" ref={el => this.ig = el}>{tiles}</div>
      </DndProvider>
    );
  }
}

function ItemTile ({ id, children }) {
  const ref = useRef(null);
  const [,drop] = useDrop({
    accept: "TILE",
  });
  const [{ isDragging }, drag] = useDrag({
    item: { id, type: "TILE" }
  });

  const style = {
    opacity: isDragging ? 0.25 : 1
  };

  drag(drop(ref));

  return (
    <div className="tile" ref={ref} style={style}>{children}</div>
  );
}

function mapStateToProps(state) {
  const { inventory } = state;
  return {
    inventory: inventory.inventory,
    inventorySize: inventory.inventorySize
  };
}

export default connect(mapStateToProps)(ItemGrid);
