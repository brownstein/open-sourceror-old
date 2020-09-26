const Laser = require("laser");
// const hardfield = require("hardfield");
// const solarpanel = require("solarpanel");

const l = new Laser({
  intensity: 1,
  relativePosition: {
    x: 32,
    y: 0
  },
  direction: {
    x: 1,
    y: -1
  }
});

// fire the laser
l.fire();

// turn laser off after 5 seconds
setTimeout(() => l.off(), 5000);
