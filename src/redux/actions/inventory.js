import {
  ADD_ITEM_TO_INVENTORY,
  REMOVE_ITEM_FROM_INVENTORY,
  MOVE_ITEM_IN_INVENTORY,
  ASSIGN_HOTKEY_TO_ITEM,
  USE_ITEM,
} from "../constants/inventory";

import {
  runScript
} from "./scripts";

export function addItemToInventory(itemName) {
  return {
    type: ADD_ITEM_TO_INVENTORY,
    itemName
  };
}

export function removeItemFromInventory({
  itemName = null,
  itemSlot = null
}) {
  return {
    type: REMOVE_ITEM_FROM_INVENTORY,
    itemName,
    itemSlot
  };
}

export function moveItemInInventory({
  fromSlot,
  toSlot
}) {
  return {
    type: MOVE_ITEM_IN_INVENTORY,
    fromSlot,
    toSlot
  };
}

export function assignHotkeyToItem(hotkey, currentInventorySlot) {
  return {
    type: ASSIGN_HOTKEY_TO_ITEM,
    hotkey,
    currentInventorySlot
  };
}

export function useItem(itemId) {
  return {
    type: USE_ITEM,
    itemId
  };
}
