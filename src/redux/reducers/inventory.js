import {
  ADD_ITEM_TO_INVENTORY,
  REMOVE_ITEM_FROM_INVENTORY,
  MOVE_ITEM_IN_INVENTORY
} from "../constants/inventory";
import { LOAD_GAME } from "../constants/save-state";

const INITIAL_STATE = {
  inventorySize: 10,
  inventory: [
    "Scroll",
    "Medkit",
    "Scroll",
    null,
    "Medkit"
  ]
};

/**
 * Reducer for the player's inventory system
 */
export default function reduceInventory(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ADD_ITEM_TO_INVENTORY: {
      const itemName = action.itemName;
      const inventorySize = state.inventorySize;
      const inventory = [...state.inventory];
      for (let i = 0; i < inventorySize; i++) {
        if (!inventory[i]) {
          inventory[i] = itemName;
          break;
        }
      }
      return {
        ...state,
        inventory
      };
    }
    case REMOVE_ITEM_FROM_INVENTORY: {
      const { itemName, itemSlot } = action;
      const inventory = [...state.inventory];
      if (itemSlot) {
        inventory[itemSlot] = null;
      }
      else {
        for (let i = 0; i < inventorySize; i++) {
          if (inventory[i] === itemName) {
            inventory[i] = null;
            break;
          }
        }
      }
      return {
        ...state,
        inventory
      };
    }
    case MOVE_ITEM_IN_INVENTORY: {
      const newInventory = [...state.inventory];
      const a = newInventory[action.fromSlot];
      const b = newInventory[action.toSlot] || null;
      newInventory[action.fromSlot] = b;
      newInventory[action.toSlot] = a;
      for (let i = 0; i < newInventory.length; i++) {
        if (newInventory[i] === undefined) {
          newInventory[i] = null;
        }
      }
      return {
        ...state,
        inventory: newInventory
      };
    }
    default:
      return state;
  }
}
