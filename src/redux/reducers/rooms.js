import {
  TRANSITION_TO_ROOM
} from "src/redux/constants/rooms";import {
  LOAD_GAME
} from "../constants/save-state";

const INITIAL_STATE = {
  currentRoom: null,
  previousRoom: null,
  transitionPosition: null,
  transitionType: null
};

export default function reduceRoomState(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRANSITION_TO_ROOM:
      return {
        ...state,
        currentRoom: action.room,
        previousRoom: state.currentRoom,
        transitionPosition: action.transitionPosition,
        transitionType: 'traverse'
      };
    case LOAD_GAME: {
      return {
        ...state,
        currentRoom: action.data.room,
        previousroom: null,
        transitionToPosition: null,
        transitionType: 'load'
      }
    }
    default:
      break;
  }
  return state;
}
