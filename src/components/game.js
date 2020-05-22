import EventEmitter from "events";
import { Component, CreateContext } from "react";

export const GameContext = CreateContext({
  engine: null,
  paused: false
});

class Game {

}
