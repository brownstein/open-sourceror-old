"use strict";
const acorn = require("acorn");

module.exports = function dumpAcornAST (script) {
  const parsed = acorn.parse(script, {
    locations: true
  });
  fs.writeFileSync("temp1.json", JSON.stringify(node, 0, 2));
};
