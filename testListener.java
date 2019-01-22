// Generated from test.g4 by ANTLR 4.7.2
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link testParser}.
 */
public interface testListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link testParser#r}.
	 * @param ctx the parse tree
	 */
	void enterR(testParser.RContext ctx);
	/**
	 * Exit a parse tree produced by {@link testParser#r}.
	 * @param ctx the parse tree
	 */
	void exitR(testParser.RContext ctx);
	/**
	 * Enter a parse tree produced by {@link testParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterExpr(testParser.ExprContext ctx);
	/**
	 * Exit a parse tree produced by {@link testParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitExpr(testParser.ExprContext ctx);
}