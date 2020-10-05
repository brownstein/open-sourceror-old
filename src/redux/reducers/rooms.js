import {
  TRANSITION_TO_ROOM
} from "src/redux/constants/rooms";

const INITIAL_STATE = {
  currentRoom: null,
  previousRoom: null,
  transitionPosition: null
};

export default function reduceRoomState(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRANSITION_TO_ROOM:
      return {
        ...state,
        currentRoom: action.room,
        previousRoom: state.currentRoom,
        transitionPosition: action.transitionPosition
      };
    default:
      break;
  }
  return state;
}
