import { connect } from "react-redux";

import ItemSlot, { ItemBox } from "src/components/items/item-slot";
import { assignHotkeyToItem } from "src/redux/actions/inventory";

import "./hotkey-row.less";

function HotkeyRow({
  interactive = true,
  hotkeyItemArray,
  dragItemToInventory,
  activeScriptIds
}) {
  return (
    <div className="hotkey-row">
      { hotkeyItemArray.map((item, index) => {
        if (interactive) {
          return (
            <ItemSlot
              key={index}
              inventoryLocation={["hotkeys", (index + 1) % 10]}
              item={item}
              displayHotkey={(index + 1) % 10}
              onDropItem={({ draggedTo, draggedItem }) =>
                dragItemToInventory(draggedTo[1], draggedItem)
              }
              onDropOut={() => dragItemToInventory((index + 1 % 10), null)}
              />
          );
        }
        else {
          const isActive = item && item.itemData &&
            activeScriptIds.includes(item.itemData.scriptId);
          return (
            <ItemBox
              key={index}
              item={item}
              displayHotkey={(index + 1) % 10}
              extraClasses={isActive ? ["active"] : []}
              />
          );
        }
      }) }
    </div>
  );
}

function mapStateToProps(state) {
  const { inventory, scripts } = state;
  const hotkeyItemArray = [];
  for (let i = 0; i < 10; i++) {
    const itemId = inventory.numericHotkeyMap[(i + 1) % 10];
    let item = null;
    if (itemId) {
      item = inventory.inventory.find(item => item.id === itemId) || null;
    }
    hotkeyItemArray.push(item);
  }

  const activeScriptIds = Object.keys(scripts.activeScripts)
    .map(k => scripts.activeScripts[k])
    .filter(s => s.running)
    .map(s => s.scriptId);

  return {
    hotkeyItemArray,
    activeScriptIds
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
