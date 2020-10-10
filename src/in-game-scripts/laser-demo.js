const Laser = require("laser");
const Reflector = require("reflector");

const l = new Laser({
  intensity: 1,
  relativePosition: {
    x: 16,
    y: -30
  },
  direction: Math.PI * -0.1
});

const r = new Reflector({
  relativePosition: {
    x: 60,
    y: -26
  },
  direction: Math.PI * 0.75
});

const r2 = new Reflector({
  relativePosition: {
    x: 70,
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
  l.aim(0.1 - Math.sin(t / 5) * 0.2);
  l.move([0, Math.sin(t / 10) / 3]);
  r.move([0, Math.sin(t / 10) / 2]);
  r2.rotate(-0.015);
  t++;
}
moveReflectors();

setTimeout(() => {
  done = true;
}, 3000);
