// Generated from test.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');



var serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964",
    "\u0002\u0007\u001f\b\u0001\u0004\u0002\t\u0002\u0004\u0003\t\u0003\u0004",
    "\u0004\t\u0004\u0004\u0005\t\u0005\u0004\u0006\t\u0006\u0003\u0002\u0003",
    "\u0002\u0003\u0003\u0003\u0003\u0003\u0004\u0003\u0004\u0003\u0005\u0003",
    "\u0005\u0003\u0005\u0005\u0005\u0017\n\u0005\u0003\u0006\u0003\u0006",
    "\u0007\u0006\u001b\n\u0006\f\u0006\u000e\u0006\u001e\u000b\u0006\u0002",
    "\u0002\u0007\u0003\u0003\u0005\u0004\u0007\u0005\t\u0006\u000b\u0007",
    "\u0003\u0002\u0005\u0004\u0002\f\f\u000f\u000f\u0006\u00022;C\\aac|",
    "\b\u0002\u000b\u000b\"\"2;C\\aac|\u0002 \u0002\u0003\u0003\u0002\u0002",
    "\u0002\u0002\u0005\u0003\u0002\u0002\u0002\u0002\u0007\u0003\u0002\u0002",
    "\u0002\u0002\t\u0003\u0002\u0002\u0002\u0002\u000b\u0003\u0002\u0002",
    "\u0002\u0003\r\u0003\u0002\u0002\u0002\u0005\u000f\u0003\u0002\u0002",
    "\u0002\u0007\u0011\u0003\u0002\u0002\u0002\t\u0016\u0003\u0002\u0002",
    "\u0002\u000b\u0018\u0003\u0002\u0002\u0002\r\u000e\u0007,\u0002\u0002",
    "\u000e\u0004\u0003\u0002\u0002\u0002\u000f\u0010\u0007\"\u0002\u0002",
    "\u0010\u0006\u0003\u0002\u0002\u0002\u0011\u0012\u0007\u000b\u0002\u0002",
    "\u0012\b\u0003\u0002\u0002\u0002\u0013\u0017\t\u0002\u0002\u0002\u0014",
    "\u0015\u0007\u000f\u0002\u0002\u0015\u0017\u0007\f\u0002\u0002\u0016",
    "\u0013\u0003\u0002\u0002\u0002\u0016\u0014\u0003\u0002\u0002\u0002\u0017",
    "\n\u0003\u0002\u0002\u0002\u0018\u001c\t\u0003\u0002\u0002\u0019\u001b",
    "\t\u0004\u0002\u0002\u001a\u0019\u0003\u0002\u0002\u0002\u001b\u001e",
    "\u0003\u0002\u0002\u0002\u001c\u001a\u0003\u0002\u0002\u0002\u001c\u001d",
    "\u0003\u0002\u0002\u0002\u001d\f\u0003\u0002\u0002\u0002\u001e\u001c",
    "\u0003\u0002\u0002\u0002\u0005\u0002\u0016\u001c\u0002"].join("");


var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

var decisionsToDFA = atn.decisionToState.map( function(ds, index) { return new antlr4.dfa.DFA(ds, index); });

function testLexer(input) {
	antlr4.Lexer.call(this, input);
    this._interp = new antlr4.atn.LexerATNSimulator(this, atn, decisionsToDFA, new antlr4.PredictionContextCache());
    return this;
}

testLexer.prototype = Object.create(antlr4.Lexer.prototype);
testLexer.prototype.constructor = testLexer;

Object.defineProperty(testLexer.prototype, "atn", {
        get : function() {
                return atn;
        }
});

testLexer.EOF = antlr4.Token.EOF;
testLexer.T__0 = 1;
testLexer.T__1 = 2;
testLexer.T__2 = 3;
testLexer.NL = 4;
testLexer.CONTENT = 5;

testLexer.prototype.channelNames = [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ];

testLexer.prototype.modeNames = [ "DEFAULT_MODE" ];

testLexer.prototype.literalNames = [ null, "'*'", "' '", "'\t'" ];

testLexer.prototype.symbolicNames = [ null, null, null, null, "NL", "CONTENT" ];

testLexer.prototype.ruleNames = [ "T__0", "T__1", "T__2", "NL", "CONTENT" ];

testLexer.prototype.grammarFileName = "test.g4";



exports.testLexer = testLexer;

