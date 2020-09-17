import { connect } from "react-redux";

import ItemSlot, { ItemBox } from "src/components/items/item-slot";
import { assignHotkeyToItem } from "src/redux/actions/inventory";

import "./hotkey-row.less";

function HotkeyRow({
  interactive = true,
  hotkeyItemArray,
  dragItemToInventory,
}) {
  return (
    <div className="hotkey-row">
      { hotkeyItemArray.map((item, index) => {
        if (interactive) {
          return (
            <ItemSlot
              key={index}
              inventoryLocation={["hotkeys", index + 1]}
              item={item}
              displayHotkey={index + 1}
              onDropItem={({ draggedTo, draggedItem }) =>
                dragItemToInventory(draggedTo[1], draggedItem)
              }
              onDropOut={() => dragItemToInventory(index + 1, null)}
              />
          );
        }
        else {
          return (
            <ItemBox
              key={index}
              item={item}
              displayHotkey={index + 1}
              />
          );
        }
      }) }
    </div>
  );
}

function mapStateToProps(state) {
  const { inventory } = state;
  const hotkeyItemArray = [];
  for (let i = 0; i < 8; i++) {
    const itemId = inventory.numericHotkeyMap[i + 1];
    let item = null;
    if (itemId) {
      item = inventory.inventory.find(item => item.id === itemId) || null;
    }
    hotkeyItemArray.push(item);
  }
  return {
    hotkeyItemArray
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dragItemToInventory(slot, item) {
      return dispatch(assignHotkeyToItem(slot, item));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HotkeyRow);
