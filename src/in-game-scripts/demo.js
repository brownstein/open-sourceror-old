"use strict";
const fire = require("fire");
const push = require("push");
const Sensor = require("sensor");

var s = new Sensor(100);
var active = true;

// our main attack loop is going to start running immediately and execute every
// 50 milliseconds
function keepGoing() {
  if (!active) {
    return;
  }
  s.getNearbyThings().forEach(n => {
    const relativeVelocity = {
      x: n.relativePosition.x * 5,
      y: n.relativePosition.y * 5
    };
    const relativePosition = {
      x: n.relativePosition.x,
      y: n.relativePosition.y + 16
    };
    fire(null, relativeVelocity);
    // push(relativePosition, 10, 100);
  });
  setTimeout(keepGoing, 50);

  // un-comment to enable variable sensor radius
  // s.setRadius(30 + (new Date().getTime() % 1000) * 0.1);
}

// start the loop
keepGoing();

// set a timeout to end execution
setTimeout(() => {
  active = false;
}, 10000);
