export default async function requireRoom(roomName) {
  let roomModule = null;
  switch (roomName) {
    case "tutorial-1":
      roomModule = await import("./intro/1");
      break;
    case "tutorial-2":
      roomModule = await import("./intro/2");
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
