import { ipcRenderer, remote } from "electron";

import LoadSaveStore from "src/engine/load-save";
import {
  SAVE_GAME,
  LOAD_GAME
} from "src/redux/constants/save-state";


export function saveGame(engine) {
  const room = engine.currentRoom;
  const controllingEntity = engine.controllingEntity;

  const persistEntities = engine.activeEntities.filter(e => e.persist);

  return (dispatch, getState) => {
    const {
      status,
      inventory
    } = getState();

    const loadSaveStore = new LoadSaveStore();
    loadSaveStore.save({
      status,
      inventory,
      room: room.roomName
    });

    ipcRenderer.send('save', {
      status,
      room: room.roomName
    });

    dispatch({
      type: SAVE_GAME
    });
  };
}

export const loadGame = (gameFileContents) => ({
  type: LOAD_GAME,
  gameFileContents
});
