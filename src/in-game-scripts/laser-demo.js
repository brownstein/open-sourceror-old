const Laser = require("laser");
const Reflector = require("reflector");

const l = new Laser({
  intensity: 1,
  relativePosition: {
    x: 16,
    y: 0
  },
  direction: Math.PI * -0.1
});

const r = new Reflector({
  relativePosition: {
    x: 100,
    y: -26
  },
  direction: Math.PI * 0.75
});

const r2 = new Reflector({
  relativePosition: {
    x: 110,
    y: -80
  }
});

// turn laser off after 5 seconds
setTimeout(() => l.off(), 1000);
setTimeout(() => l.on(), 1500);
setTimeout(() => l.off(), 2000);

// test reflector movement
let done = false;
let t = 0;
function moveReflectors() {
  if (done) {
    return;
  }
  setTimeout(moveReflectors, 5);
  r.move([0, Math.sin(t / 10) / 2]);
  r2.move([0, -Math.sin(t / 10) / 2]);
  t++;
}
moveReflectors();

setTimeout(() => {
  done = true;
}, 3000);
