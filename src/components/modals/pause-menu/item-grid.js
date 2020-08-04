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
    const { inventory, inventorySize } = props;

    this.mounted = false;
    this.dpr = window.devicePixelRatio;
    this.iconSize = 40;

    this.webGLCanvas = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.tileCanvasesAndContexts = [];
    this.tileSprites = [];

    for (let i = 0; i < inventorySize; i++) {
      this.tileCanvasesAndContexts[i] = {
        canvas: null,
        context: null
      };
      this.tileSprites[i] = null;
    }

    this.state = {
      draggingFromSlot: null,
      draggingToSlot: null,
      dragInventory: null
    };

    this._prepareFrame = this._prepareFrame.bind(this);
    this._renderFrame = this._renderFrame.bind(this);

    this._onDragStart = this._onDragStart.bind(this);
    this._onDropHover = this._onDropHover.bind(this);
    this._onDragFinish = this._onDragFinish.bind(this);
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

    // initialize the onscreen canvases
    for (let i = 0; i < this.tileCanvasesAndContexts.length; i++) {
      const data = this.tileCanvasesAndContexts[i];
      data.canvas.width = 40 * this.dpr;
      data.canvas.height = 40 * this.dpr;
      data.context = data.canvas.getContext("2d");
      data.context.scale(this.dpr, this.dpr);
    }

    this.mounted = true;
    this._prepareFrame();
  }
  componentDidUpdate() {
    this._prepareFrame();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.renderer.dispose();
  }
  _prepareFrame() {
    if (!this.mounted) {
      return;
    }
    const { inventory, inventorySize } = this.props;
    const { dragInventory } = this.state;

    const currentInventory = dragInventory || inventory;

    const promises = [];
    for (let i = 0; i < inventorySize; i++) {
      const { itemName, id } = currentInventory[i] || {};
      if (!itemName) {
        this.tileSprites[i] = null;
        continue;
      }
      const ItemClass = items[itemName];
      if (!ItemClass) {
        throw new Error("Missing item", itemName);
      }
      const itemSprite = ItemClass.getIcon();
      this.tileSprites[i] = itemSprite;
      promises.push(itemSprite.readyPromise);
    }
    Promise.all(promises).then(this._renderFrame);
  }
  _renderFrame() {
    if (!this.mounted) {
      return;
    }
    for (let i = 0; i < this.tileSprites.length; i++) {
      const tileData = this.tileCanvasesAndContexts[i];
      const { canvas, context } = tileData;

      // clear the 2D canvas no matter what
      context.clearRect(0, 0, canvas.width, canvas.height);

      // get the sprite
      const sprite = this.tileSprites[i];
      if (!sprite) {
        continue;
      }

      // render the sprite into the scene and then immediately remove it
      if (sprite.mesh) {
        this.scene.add(sprite.mesh);
        this.renderer.render(this.scene, this.camera);
        this.scene.remove(sprite.mesh);
      }

      // copy webgl canvas to inexpensive 2D canvas
      context.drawImage(this.webGLCanvas, 0, 0, this.iconSize, this.iconSize);
    }
  }
  _onDragStart(draggingFromSlot) {
    this.setState({
      draggingFromSlot: draggingFromSlot,
      dragInventory: [...this.props.inventory]
    });
  }
  _onDropHover(draggingToSlot) {
    const { inventory } = this.props;
    const { draggingFromSlot, draggingToSlot: current } = this.state;
    if (current === draggingToSlot) {
      return;
    }

    const dragInventory = [...inventory];
    const a = dragInventory[draggingFromSlot] || null;
    const b = dragInventory[draggingToSlot] || null;
    dragInventory[draggingFromSlot] = b;
    dragInventory[draggingToSlot] = a;

    this.setState({
      draggingToSlot,
      dragInventory
    });
  }
  _onDragFinish(onTarget) {
    const { moveItem } = this.props;
    const { draggingFromSlot, draggingToSlot } = this.state;

    if (onTarget && draggingFromSlot !== draggingToSlot) {
      moveItem(draggingFromSlot, draggingToSlot);
    }

    this.setState({
      draggingFromSlot: null,
      draggingToSlot: null,
      dragInventory: null
    });
  }
  render() {
    const { inventory, inventorySize } = this.props;
    const {
      tileCanvasesAndContexts,
      _onDragStart,
      _onDropHover,
      _onDragFinish
    } = this;

    const tiles = [];
    for (let i = 0; i < inventorySize; i++) {
      const item = inventory[i] || { itemName: null };
      const tileData = tileCanvasesAndContexts[i];
      tiles.push(
        <ItemTile key={i} index={i} {...{
          onDragStart: _onDragStart,
          onDropHover: _onDropHover,
          onDragFinish: _onDragFinish
        }}>
          <canvas ref={el => tileData.canvas = el }/>
          <div className="itemname">{item.itemName}</div>
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

function ItemTile ({
  index,
  children,
  onDragStart,
  onDropHover,
  onDragFinish
}) {
  const ref = useRef(null);
  const [,drop] = useDrop({
    accept: "TILE",
    hover: (item, monitor) => {
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hBBox = ref.current.getBoundingClientRect();
      const hCenter = {
        x: hBBox.left + hBBox.width / 2,
        y: hBBox.top + hBBox.height / 2
      };
      const clientOffset = monitor.getClientOffset();
      if (
        Math.abs(clientOffset.x - hCenter.x) < 20 &&
        Math.abs(clientOffset.y - hCenter.y) < 20
      ) {
        onDropHover(hoverIndex);
      }
    }
  });
  const [{ isDragging }, drag] = useDrag({
    item: { index, id: index, type: "TILE" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    begin: (monitor) => {
      onDragStart(index);
    },
    end: (dropResult, monitor) => {
      onDragFinish(monitor.didDrop());
    }
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
    inventory: inventory.inventory.map((itemName, id) => ({ itemName, id })),
    inventorySize: inventory.inventorySize
  };
}

function mapDispatchToProps(dispatch) {
  return {
    moveItem: (fromSlot, toSlot) => dispatch(moveItemInInventory({
      fromSlot,
      toSlot
    }))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemGrid);
