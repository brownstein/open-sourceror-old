// Generated from test.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete listener for a parse tree produced by testParser.
function testListener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

testListener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
testListener.prototype.constructor = testListener;

// Enter a parse tree produced by testParser#elements.
testListener.prototype.enterElements = function(ctx) {
};

// Exit a parse tree produced by testParser#elements.
testListener.prototype.exitElements = function(ctx) {
};


// Enter a parse tree produced by testParser#element.
testListener.prototype.enterElement = function(ctx) {
};

// Exit a parse tree produced by testParser#element.
testListener.prototype.exitElement = function(ctx) {
};


// Enter a parse tree produced by testParser#emptyLine.
testListener.prototype.enterEmptyLine = function(ctx) {
};

// Exit a parse tree produced by testParser#emptyLine.
testListener.prototype.exitEmptyLine = function(ctx) {
};



exports.testListener = testListener;