import { ipcRenderer, remote } from "electron";

import LoadSaveStore from "src/engine/load-save";
import {
  SAVE_GAME,
  LOAD_GAME
} from "src/redux/constants/save-state";

import {
  getCompletePersistenceState,
  setCompletePersistenceState
} from "src/engine/room";

export function saveGame(engine) {
  return (dispatch, getState) => {
    const room = engine.currentRoom;
    const controllingEntity = engine.controllingEntity;

    const currentRoomState = engine.getSnapshot();
    const restOfRoomState = getCompletePersistenceState();

    // form a complete picture of the game's persistence
    const persistState = {
      ...restOfRoomState,
      [engine.getCurrentRoom()]: currentRoomState
    };

    const {
      status,
      inventory
    } = getState();

    const loadSaveStore = new LoadSaveStore();
    const data = {
      status,
      inventory,
      room: room.roomName,
      persistState
    };

    loadSaveStore.save(data);
    ipcRenderer.send('save', data);

    dispatch({
      type: SAVE_GAME
    });
  };
}

export const loadGame = () => {
  return (dispatch, getState) => {

    const saveStore = new LoadSaveStore();

    if (!saveStore.saveFileExists) {
      throw new Error("no save file present");
    }

    const data = saveStore.load();
    setCompletePersistenceState(data.persistState);

    return dispatch({
      type: LOAD_GAME,
      data
    });
  };
};
