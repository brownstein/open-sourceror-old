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
import ItemSlot from "src/components/items/item-slot";

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
  _onDragFinish(dropProps) {
    const { moveItem } = this.props;
    const { draggedFrom, draggedTo } = dropProps;
    if (draggedFrom !== draggedTo) {
      moveItem(draggedFrom, draggedTo);
    }
  }
  render() {
    const { inventory, inventorySize } = this.props;
    const { _onDragFinish } = this;

    const tiles = [];
    for (let i = 0; i < inventorySize; i++) {
      const item = inventory[i] || null;
      tiles.push(
        <ItemSlot
          key={i}
          item={item}
          inventoryLocation={i}
          displayHotkey={i}
          onDropItem={_onDragFinish}
          />
      );
    }

    return (
      <div className="item-grid">{tiles}</div>
    );
  }
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
