// Define a grammar called Hello
grammar test;
elements
    : (element|emptyLine)* (EOF|NL+)
    ;

element
    : '*' ( ' ' | '\t' )* CONTENT NL+
    ;

emptyLine
    : NL
    ;

NL
    : '\r' | '\n' | '\r\n'
    ;
CONTENT
    : [a-zA-Z0-9_][a-zA-Z0-9_ \t]*
    ;
