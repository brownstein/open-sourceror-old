import {
  ADD_ITEM_TO_INVENTORY,
  REMOVE_ITEM_FROM_INVENTORY,
  MOVE_ITEM_IN_INVENTORY
} from "../constants/inventory";

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
