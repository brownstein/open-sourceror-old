"use strict";
const Fire = require("fire");
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

  let f;

  s.getNearbyThings().forEach(n => {
    const relativeVelocity = {
      x: n.relativePosition.x * 5,
      y: n.relativePosition.y * 5
    };
    const relativePosition = {
      x: n.relativePosition.x,
      y: n.relativePosition.y + 16
    };

    f = new Fire(null, relativeVelocity);
    let t = 100;

    function changeAccelleration() {
      t -= 1;
      if (t <= 0) {
        return;
      }
      setTimeout(changeAccelleration, 20);
      f.accelerate([0, -2]);
    }

    changeAccelleration();
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
