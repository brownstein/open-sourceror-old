import {
  SAVE_GAME,
  LOAD_GAME
} from "src/redux/constants/save-state";

export function saveGame(engine) {
  const room = engine.currentRoom;
  const persistEntities = engine.activeEntities.filter(e => e.persist);

  console.log('SAVING', { room, persistEntities });

  return (dispatch, getState) => {
    const status = getState().status;

    console.log('S', { status });

    dispatch({
      type: SAVE_GAME
    });
  };
}

export const loadGame = (gameFile) => ({
  type: LOAD_GAME,
  gameFile
});
