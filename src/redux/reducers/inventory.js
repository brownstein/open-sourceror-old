import shortId from "shortid";
import {
  ADD_ITEM_TO_INVENTORY,
  REMOVE_ITEM_FROM_INVENTORY,
  MOVE_ITEM_IN_INVENTORY,
  ASSIGN_HOTKEY_TO_ITEM,
  USE_ITEM
} from "../constants/inventory";
import {
  ADD_SCRIPT_TO_LIBRARY
} from "../constants/scripts";
import { LOAD_GAME } from "../constants/save-state";

const INITIAL_STATE = {
  inventorySize: 20,
  inventory: [
    { id: shortId(), itemName: "Scroll", itemData: { color: "#ffa" } },
    { id: shortId(), itemName: "Medkit" },
    { id: shortId(), itemName: "Scroll" },
    { id: shortId(), itemName: "Medkit" },
  ],
  numericHotkeyMap: {}
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
          inventory[i] = {
            id: shortId(),
            itemName
          };
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
      let removedItem = null;
      if (itemSlot) {
        removedItem = inventory[itemSlot];
        inventory[itemSlot] = null;
      }
      else {
        for (let i = 0; i < inventorySize; i++) {
          if (inventory[i] === itemName) {
            removedItem = inventory[i];
            inventory[i] = null;
            break;
          }
        }
      }
      const updatedHotkeyMap = { ...state.numericHotkeyMap };
      if (removedItem) {
        Object.keys(updatedHotkeyMap).forEach(hotkey => {
          const itemId = updatedHotkeyMap[hotkey];
          if (itemId === removedItem.id) {
            delete updatedHotkeyMap[hotkey];
          }
        });
      }
      return {
        ...state,
        inventory,
        numericHotkeyMap: updatedHotkeyMap
      };
    }
    case MOVE_ITEM_IN_INVENTORY: {
      const newInventory = [...state.inventory];
      const a = newInventory[action.fromSlot];
      const b = newInventory[action.toSlot] || null;
      newInventory[action.fromSlot] = null;
      newInventory.splice(action.toSlot, 0, a);
      let shift = 0;
      for (let i = 0; i < newInventory.length; i++) {
        if (newInventory[i] === undefined) {
          newInventory[i] = null;
        }
        if (newInventory[i] === null) {
          shift++;
        }
        // slide items left
        if (shift && newInventory[i]) {
          newInventory[i - shift] = newInventory[i];
          newInventory[i] = null;
        }
      }
      return {
        ...state,
        inventory: newInventory
      };
    }
    case ASSIGN_HOTKEY_TO_ITEM: {
      const item = state.inventory[action.currentInventorySlot];
      const itemId = item ? item.id : null;
      return {
        ...state,
        numericHotkeyMap: {
          ...state.numericHotkeyMap,
          [action.hotkey]: itemId
        }
      };
    }
    case ADD_SCRIPT_TO_LIBRARY: {
      const scriptItem = {
        id: action.id,
        itemName: "Scroll",
        itemData: {
          color: "#aff",
          isScript: true,
          scriptContents: action.scriptContents
        }
      };
      const newInventory = [...state.inventory, scriptItem];
      return {
        ...state,
        inventory: newInventory
      };
    }
    case USE_ITEM: {
      return {
        ...state,
        inventory: state.inventory.map(item => {
          if (!item) {
            return item;
          }
          if (item.id === action.itemId) {
            return {
              ...item,
              lastUsedAt: new Date().getTime()
            };
          }
          return item;
        })
      }
    }
    default:
      return state;
  }
}
