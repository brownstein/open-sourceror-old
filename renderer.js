"use strict";
const { ipcRenderer } = require("electron");
const fs = require("fs");

const esprima = require("esprima");
console.log(esprima.parseScript(`
  "use strict";
  on(MOTION, ()=> {
    console.log(1);
  });
`));

// document.getElementById("parse").addEventListener("click", function(){
//     var input = document.getElementById("code").value;
//     var chars = new antlr4.InputStream(input);
//     var lexer = new TestLexer.testLexer(chars);
//     var tokens  = new antlr4.CommonTokenStream(lexer);
//     var parser = new TestParser.testParser(tokens);
//     parser.buildParseTrees = true;
//     parser.elements().children.forEach(c => c.CONTENT &&
//       console.log(c.CONTENT().getText())
//     )
// });
