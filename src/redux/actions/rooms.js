import {
  TRANSITION_TO_ROOM
} from "src/redux/constants/rooms";

export const transitionToRoom = (room) => ({
  type: TRANSITION_TO_ROOM,
  room
});
