import {
  TRANSITION_TO_ROOM
} from "src/redux/constants/rooms";

export const transitionToRoom = (roomName) => ({
  type: TRANSITION_TO_ROOM,
  roomName
});
