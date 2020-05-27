import {
  SAVE_GAME,
  LOAD_GAME
} from "src/redux/constants/save-state";

export const saveGame = (gameState) => ({
  type: SAVE_GAME,
  gameData
});

export const loadGame = (gameFile) => ({
  type: LOAD_GAME,
  gameFile
});
