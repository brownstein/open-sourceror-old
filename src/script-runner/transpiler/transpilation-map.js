/**
 * A fairly space-efficient map from transpiled tokens to source tokens
 */
export default class TranspilationMap {
  constructor() {
    this.tokensByDestStartIndex = {};
  }
  addToken(srcStart, srcEnd, destStart, destEnd) {
    let tokensAtIndex = this.tokensByDestStartIndex[destStart];
    if (!tokensAtIndex) {
      tokensAtIndex = [];
      this.tokensByDestStartIndex[destStart] = [];
    }
    tokensAtIndex.push([destEnd, srcStart, srcEnd]);
  }
  getSourceLocation(destStart, destEnd) {
    const tokensAtIndex = this.tokensByDestStartIndex[destStart];
    if (!tokensAtIndex) {
      return [null, null];
    }
    for (let ti = 0; ti < tokensAtIndex.length; ti++) {
      const [tokenDestEnd, tokenSrcStart, tokenSrcEnd] = tokensAtIndex[ti];
      if (tokenDestEnd === destEnd) {
        return [tokenSrcStart, tokenSrcEnd];
      }
    }
    return [null, null];
  }
}
