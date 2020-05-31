import keycode from "keycode";

export default class KeyState {
  constructor () {
    this.keyDown = {};
    this.el = null;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.keyDownSnapshot = {};
  }
  mount (domElement) {
    if (this.el) {
      this.unmount();
    }
    this.el = domElement;
    this.el.addEventListener("keydown", this.onKeyDown);
    this.el.addEventListener("keyup", this.onKeyUp);
  }
  unmount () {
    if (!this.el) {
      return;
    }
    this.el.removeEventListener("keydown", this.onKeyDown);
    this.el.removeEventListener("keyup", this.onKeyUp);
    this.el = null;
  }
  onKeyDown (e) {
    const { key } = e;
    this.keyDown[key] = true;
  }
  onKeyUp (e) {
    const { key } = e;
    this.keyDown[key] = false;
  }
  isKeyDown (key) {
    return this.keyDown[key] || false;
  }
  // helper for getting key events fired while the game is taking place
  runEvents() {
    const newEvents = [];

    Object.keys(this.keyDown).forEach(key => {
      if (this.keyDown[key] && !this.keyDownSnapshot[key]) {
        newEvents.push({ key, down: true });
        this.keyDownSnapshot[key] = true;
      }
    });
    Object.keys(this.keyDownSnapshot).forEach(key => {
      if (!this.keyDown[key] && this.keyDownSnapshot[key]) {
        newEvents.push({ key, up: true });
        this.keyDownSnapshot[key] = false;
      }
    });

    return newEvents;
  }
}

function mountKeystate (domElement) {
  const ks = new KeyState();
  domElement.addEventListener
}
