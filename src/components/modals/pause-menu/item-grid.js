import {
  Component,
  useState,
  useEffect,
  useRef
} from "react";
import { useDrag, useDrop } from "react-dnd";
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

import { ControllerContext } from "src/components/controller";
import { ItemRenderer } from "src/components/items/item-slot";

import { moveItemInInventory } from "src/redux/actions/inventory";

import Scroll from "src/entities/items/scroll";
import Medkit from "src/entities/items/medkit";

import * as items from "src/entities/items";
import "./item-grid.less";

class ItemGrid extends Component {
  static contextType = ControllerContext;
  constructor(props) {
    super(props);
    const { inventory, inventorySize } = props;

    this.state = {
      draggingFromSlot: null,
      draggingToSlot: null,
      dragInventory: null
    };

    this._onDragStart = this._onDragStart.bind(this);
    this._onDropHover = this._onDropHover.bind(this);
    this._onDragFinish = this._onDragFinish.bind(this);
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
      _onDragStart,
      _onDropHover,
      _onDragFinish
    } = this;

    const tiles = [];
    for (let i = 0; i < inventorySize; i++) {
      const item = inventory[i] || { itemName: null };
      tiles.push(
        <ItemTile key={i} index={i} {...{
          onDragStart: _onDragStart,
          onDropHover: _onDropHover,
          onDragFinish: _onDragFinish
        }}>
          <ItemRenderer item={item}/>
          <div className="itemname">{item.itemName}</div>
        </ItemTile>
      );
    }

    return (
      <div className="item-grid" ref={el => this.ig = el}>{tiles}</div>
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
