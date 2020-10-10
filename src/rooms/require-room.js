export default async function requireRoom(roomName) {
  let roomModule = null;
  switch (roomName) {
    case "room-1":
      roomModule = await import("./intro/1");
      break;
    case "room-2":
      roomModule = await import("./intro/2");
      break;
    case "room-3":
      roomModule = await import("./intro/3");
      break;
    case "pathfinder-test":
      roomModule = await import ("./test/pathfinding-tester");
      break;
    default:
      break;
  }
  if (!roomModule) {
    throw new Error("Missing room: " + roomName);
  }
  const Clazz = roomModule.default;
  return new Clazz();
}
