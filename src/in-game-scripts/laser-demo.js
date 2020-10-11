const Laser = require("laser");
const Reflector = require("reflector");

const l = new Laser({
  intensity: 1,
  relativePosition: {
    x: 0,
    y: -32
  },
  direction: Math.PI
});

const r = new Reflector({
  relativePosition: {
    x: 0,
    y: -64
  },
  direction: Math.PI * 0.55
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
  l.aim(Math.sin(t / 5) * 0.2 - Math.PI * 0.5);
  r.move([0, Math.sin(t / 10) / 3]);
  r.rotate(-0.02);
  t++;
}
moveReflectors();

setTimeout(() => {
  done = true;
}, 3000);
