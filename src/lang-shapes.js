"use strict";

class CircleSlice {
  constructor ({
    startTheta,
    endTheta,
    startRadius,
    endRadius
  } = {}) {
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.startRadius = startRadius;
    this.endRadius = endRadius;
    this.children = [];
  }
  static fromCodeExpression () {
    return new CircleSlice();
  }
}

class Symbol {
  constructor () {
    
  }
}

module.exports = {
  CircleSlice
}
