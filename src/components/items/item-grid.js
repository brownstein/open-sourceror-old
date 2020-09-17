import { Component } from "react";
import { connect } from "react-redux";

import ItemSlot from "src/components/items/item-slot";
import {
  moveItemInInventory,
  assignHotkeyToItem
} from "src/redux/actions/inventory";

import "./item-grid.less";

class ItemGrid extends Component {
  constructor(props) {
    super(props);
    const { inventory, inventorySize } = props;
    this._onDragFinish = this._onDragFinish.bind(this);
  }
  _onDragFinish(dropProps) {
    const { moveItem, assignHotkey } = this.props;
    const { draggedFrom, draggedTo } = dropProps;
    const [,draggedFromIndex] = draggedFrom;
    const [draggedToWhat, draggedToIndex] = draggedTo;
    if (draggedToWhat === "inventory") {
      if (draggedFromIndex !== draggedToIndex) {
        moveItem(draggedFromIndex, draggedToIndex);
      }
    }
    else if (draggedToWhat === "hotkeys") {
      assignHotkey(draggedFromIndex, draggedToIndex);
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
          inventoryLocation={["inventory", i]}
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
    })),
    assignHotkey: (fromSlot, hotkey) => dispatch(assignHotkeyToItem(
      hotkey,
      fromSlot
    ))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemGrid);
