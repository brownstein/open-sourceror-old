// Generated from test.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');
var testListener = require('./testListener').testListener;
var grammarFileName = "test.g4";


var serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964",
    "\u0003\u0007\'\u0004\u0002\t\u0002\u0004\u0003\t\u0003\u0004\u0004\t",
    "\u0004\u0003\u0002\u0003\u0002\u0007\u0002\u000b\n\u0002\f\u0002\u000e",
    "\u0002\u000e\u000b\u0002\u0003\u0002\u0003\u0002\u0006\u0002\u0012\n",
    "\u0002\r\u0002\u000e\u0002\u0013\u0005\u0002\u0016\n\u0002\u0003\u0003",
    "\u0003\u0003\u0007\u0003\u001a\n\u0003\f\u0003\u000e\u0003\u001d\u000b",
    "\u0003\u0003\u0003\u0003\u0003\u0006\u0003!\n\u0003\r\u0003\u000e\u0003",
    "\"\u0003\u0004\u0003\u0004\u0003\u0004\u0002\u0002\u0005\u0002\u0004",
    "\u0006\u0002\u0003\u0003\u0002\u0004\u0005\u0002)\u0002\f\u0003\u0002",
    "\u0002\u0002\u0004\u0017\u0003\u0002\u0002\u0002\u0006$\u0003\u0002",
    "\u0002\u0002\b\u000b\u0005\u0004\u0003\u0002\t\u000b\u0005\u0006\u0004",
    "\u0002\n\b\u0003\u0002\u0002\u0002\n\t\u0003\u0002\u0002\u0002\u000b",
    "\u000e\u0003\u0002\u0002\u0002\f\n\u0003\u0002\u0002\u0002\f\r\u0003",
    "\u0002\u0002\u0002\r\u0015\u0003\u0002\u0002\u0002\u000e\f\u0003\u0002",
    "\u0002\u0002\u000f\u0016\u0007\u0002\u0002\u0003\u0010\u0012\u0007\u0006",
    "\u0002\u0002\u0011\u0010\u0003\u0002\u0002\u0002\u0012\u0013\u0003\u0002",
    "\u0002\u0002\u0013\u0011\u0003\u0002\u0002\u0002\u0013\u0014\u0003\u0002",
    "\u0002\u0002\u0014\u0016\u0003\u0002\u0002\u0002\u0015\u000f\u0003\u0002",
    "\u0002\u0002\u0015\u0011\u0003\u0002\u0002\u0002\u0016\u0003\u0003\u0002",
    "\u0002\u0002\u0017\u001b\u0007\u0003\u0002\u0002\u0018\u001a\t\u0002",
    "\u0002\u0002\u0019\u0018\u0003\u0002\u0002\u0002\u001a\u001d\u0003\u0002",
    "\u0002\u0002\u001b\u0019\u0003\u0002\u0002\u0002\u001b\u001c\u0003\u0002",
    "\u0002\u0002\u001c\u001e\u0003\u0002\u0002\u0002\u001d\u001b\u0003\u0002",
    "\u0002\u0002\u001e \u0007\u0007\u0002\u0002\u001f!\u0007\u0006\u0002",
    "\u0002 \u001f\u0003\u0002\u0002\u0002!\"\u0003\u0002\u0002\u0002\" ",
    "\u0003\u0002\u0002\u0002\"#\u0003\u0002\u0002\u0002#\u0005\u0003\u0002",
    "\u0002\u0002$%\u0007\u0006\u0002\u0002%\u0007\u0003\u0002\u0002\u0002",
    "\b\n\f\u0013\u0015\u001b\""].join("");


var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

var decisionsToDFA = atn.decisionToState.map( function(ds, index) { return new antlr4.dfa.DFA(ds, index); });

var sharedContextCache = new antlr4.PredictionContextCache();

var literalNames = [ null, "'*'", "' '", "'\t'" ];

var symbolicNames = [ null, null, null, null, "NL", "CONTENT" ];

var ruleNames =  [ "elements", "element", "emptyLine" ];

function testParser (input) {
	antlr4.Parser.call(this, input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = ruleNames;
    this.literalNames = literalNames;
    this.symbolicNames = symbolicNames;
    return this;
}

testParser.prototype = Object.create(antlr4.Parser.prototype);
testParser.prototype.constructor = testParser;

Object.defineProperty(testParser.prototype, "atn", {
	get : function() {
		return atn;
	}
});

testParser.EOF = antlr4.Token.EOF;
testParser.T__0 = 1;
testParser.T__1 = 2;
testParser.T__2 = 3;
testParser.NL = 4;
testParser.CONTENT = 5;

testParser.RULE_elements = 0;
testParser.RULE_element = 1;
testParser.RULE_emptyLine = 2;


function ElementsContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = testParser.RULE_elements;
    return this;
}

ElementsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ElementsContext.prototype.constructor = ElementsContext;

ElementsContext.prototype.EOF = function() {
    return this.getToken(testParser.EOF, 0);
};

ElementsContext.prototype.element = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(ElementContext);
    } else {
        return this.getTypedRuleContext(ElementContext,i);
    }
};

ElementsContext.prototype.emptyLine = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(EmptyLineContext);
    } else {
        return this.getTypedRuleContext(EmptyLineContext,i);
    }
};

ElementsContext.prototype.NL = function(i) {
	if(i===undefined) {
		i = null;
	}
    if(i===null) {
        return this.getTokens(testParser.NL);
    } else {
        return this.getToken(testParser.NL, i);
    }
};


ElementsContext.prototype.enterRule = function(listener) {
    if(listener instanceof testListener ) {
        listener.enterElements(this);
	}
};

ElementsContext.prototype.exitRule = function(listener) {
    if(listener instanceof testListener ) {
        listener.exitElements(this);
	}
};




testParser.ElementsContext = ElementsContext;

testParser.prototype.elements = function() {

    var localctx = new ElementsContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, testParser.RULE_elements);
    var _la = 0; // Token type
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 10;
        this._errHandler.sync(this);
        var _alt = this._interp.adaptivePredict(this._input,1,this._ctx)
        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if(_alt===1) {
                this.state = 8;
                this._errHandler.sync(this);
                switch(this._input.LA(1)) {
                case testParser.T__0:
                    this.state = 6;
                    this.element();
                    break;
                case testParser.NL:
                    this.state = 7;
                    this.emptyLine();
                    break;
                default:
                    throw new antlr4.error.NoViableAltException(this);
                } 
            }
            this.state = 12;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input,1,this._ctx);
        }

        this.state = 19;
        this._errHandler.sync(this);
        switch(this._input.LA(1)) {
        case testParser.EOF:
            this.state = 13;
            this.match(testParser.EOF);
            break;
        case testParser.NL:
            this.state = 15; 
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            do {
                this.state = 14;
                this.match(testParser.NL);
                this.state = 17; 
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            } while(_la===testParser.NL);
            break;
        default:
            throw new antlr4.error.NoViableAltException(this);
        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function ElementContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = testParser.RULE_element;
    return this;
}

ElementContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ElementContext.prototype.constructor = ElementContext;

ElementContext.prototype.CONTENT = function() {
    return this.getToken(testParser.CONTENT, 0);
};

ElementContext.prototype.NL = function(i) {
	if(i===undefined) {
		i = null;
	}
    if(i===null) {
        return this.getTokens(testParser.NL);
    } else {
        return this.getToken(testParser.NL, i);
    }
};


ElementContext.prototype.enterRule = function(listener) {
    if(listener instanceof testListener ) {
        listener.enterElement(this);
	}
};

ElementContext.prototype.exitRule = function(listener) {
    if(listener instanceof testListener ) {
        listener.exitElement(this);
	}
};




testParser.ElementContext = ElementContext;

testParser.prototype.element = function() {

    var localctx = new ElementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, testParser.RULE_element);
    var _la = 0; // Token type
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 21;
        this.match(testParser.T__0);
        this.state = 25;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while(_la===testParser.T__1 || _la===testParser.T__2) {
            this.state = 22;
            _la = this._input.LA(1);
            if(!(_la===testParser.T__1 || _la===testParser.T__2)) {
            this._errHandler.recoverInline(this);
            }
            else {
            	this._errHandler.reportMatch(this);
                this.consume();
            }
            this.state = 27;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
        }
        this.state = 28;
        this.match(testParser.CONTENT);
        this.state = 30; 
        this._errHandler.sync(this);
        var _alt = 1;
        do {
        	switch (_alt) {
        	case 1:
        		this.state = 29;
        		this.match(testParser.NL);
        		break;
        	default:
        		throw new antlr4.error.NoViableAltException(this);
        	}
        	this.state = 32; 
        	this._errHandler.sync(this);
        	_alt = this._interp.adaptivePredict(this._input,5, this._ctx);
        } while ( _alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER );
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function EmptyLineContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = testParser.RULE_emptyLine;
    return this;
}

EmptyLineContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
EmptyLineContext.prototype.constructor = EmptyLineContext;

EmptyLineContext.prototype.NL = function() {
    return this.getToken(testParser.NL, 0);
};

EmptyLineContext.prototype.enterRule = function(listener) {
    if(listener instanceof testListener ) {
        listener.enterEmptyLine(this);
	}
};

EmptyLineContext.prototype.exitRule = function(listener) {
    if(listener instanceof testListener ) {
        listener.exitEmptyLine(this);
	}
};




testParser.EmptyLineContext = EmptyLineContext;

testParser.prototype.emptyLine = function() {

    var localctx = new EmptyLineContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, testParser.RULE_emptyLine);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 34;
        this.match(testParser.NL);
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


exports.testParser = testParser;
