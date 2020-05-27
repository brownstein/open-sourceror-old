import { Vector3 } from "three";

import "./dialogue.less";

export class DialogueEntity {
  constructor(position, text = null) {
    this.engine = null;

    this.text = text || ["Hello World!", "Welcome to Open Sourceror."];
    this.hoverPosition = new Vector3(position.x, position.y, 0);

    this.classNames = ["dialogue"];
    this._spin = this._spin.bind(this);

    this.hoverElement = this.render();
  }
  render() {
    let textDivs;
    if (Array.isArray(this.text)) {
      textDivs = this.text.map((t, i) => <div key={i}>{t}</div>);
    }
    else {
      textDivs = <div>{this.text}</div>;
    }
    return <div className={this.classNames.join(" ")} onClick={this._spin}>
      { textDivs }
    </div>;
  }
  _spin() {
    console.log("SPIN");
    this.classNames = ["dialogue", "spinning"];
    this.hoverElement = this.render();
    setTimeout(() => {
      this.classNames = ["dialogue"];
      this.hoverElement = this.render();
    }, 1000);
  }
}

export class DisappearingDialogue extends DialogueEntity {
  constructor(position) {
    this.engine = null;
  }
}
