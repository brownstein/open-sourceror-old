import {
  TRANSITION_TO_ROOM
} from "src/redux/constants/rooms";

export const transitionToRoom = (room, position) => ({
  type: TRANSITION_TO_ROOM,
  room,
  transitionPosition: position
});
