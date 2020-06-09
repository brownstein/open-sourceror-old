import { Vector3 } from "three";

import "./dialogue.less";

/**
 * Floating dialogue entity - the basic building block of labled things
 */
export class DialogueEntity {
  constructor(position, text = null, size = null) {
    this.engine = null;

    this.text = text || ["Hello World!"];
    this.hoverPosition = new Vector3(position.x, position.y, 0);

    this.baseClassNames = ["dialogue"];
    if (size) {
      this.baseClassNames.push(size);
    }
    this.classNames = this.baseClassNames;
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
    return <div className={this.classNames.join(" ")} onMouseDown={this._spin}>
      { textDivs }
    </div>;
  }
  _spin(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classNames = [...this.baseClassNames, "spinning"];
    this.hoverElement = this.render();
    setTimeout(() => {
      this.classNames = this.baseClassNames;
      this.hoverElement = this.render();
    }, 1000);
  }
}

export class DisappearingDialogue extends DialogueEntity {
  constructor(position) {
    this.engine = null;
  }
}
