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

import * as items from "src/entities/items";
import "./item-grid.less";

class ItemGrid extends Component {
  static contextType = ControllerContext;
  constructor(props) {
    super(props);
    const { inventory, inventorySize } = props;
    this._onDragFinish = this._onDragFinish.bind(this);
  }
  _onDragFinish(onTarget, dropProps) {
    const { moveItem } = this.props;
    const { dragIndex, dropIndex } = dropProps;

    if (onTarget && dragIndex !== dropIndex) {
      moveItem(dragIndex, dropIndex);
    }
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
          onDragFinish: _onDragFinish
        }}>
          <ItemRenderer item={item}/>
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
  const [{ canDrop, isOver },drop] = useDrop({
    accept: "TILE",
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    }),
    drop: item => ({ dragIndex: item.index, dropIndex: index })
  });
  const [{ isDragging }, drag] = useDrag({
    item: { index, id: index, type: "TILE" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (dropResult, monitor) => {
      onDragFinish(
        monitor.didDrop(),
        monitor.getDropResult()
      );
    }
  });

  const style = {
    opacity: isDragging ? 0.25 : 1,
    borderRadius: canDrop ? 4 : 0,
    border: isOver ? '2px solid #4ff' : null
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

function mapDispatchToProps(dispatch) {
  return {
    moveItem: (fromSlot, toSlot) => dispatch(moveItemInInventory({
      fromSlot,
      toSlot
    }))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemGrid);
