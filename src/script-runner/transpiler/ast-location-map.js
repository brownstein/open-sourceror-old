/**
 * Helper class for getting the closest AST node to a given location pair
 */
export default class ASTLocationMap {
  constructor () {
    this.nodesByLine = {};
  }
  addASTNode (node) {
    if (!node.loc) {
      return;
    }
    const start = node.loc.start;
    const end = node.loc.end;
    for (let line = start.line; line <= end.line; line++) {
      if (!this.nodesByLine[line]) {
        this.nodesByLine[line] = [];
      }
      this.nodesByLine[line].push(node);
    }
  }
  getMatchingNode (node, sourceStartLine, sourceStartCol) {
    let leastDistance = Infinity;
    let closestNode = null;
    const lineNodes = this.nodesByLine[sourceStartLine];
    if (!lineNodes || !lineNodes.length) {
      return null;
    }
    for (let ln = 0; ln < lineNodes.length; ln++) {
      const lineNode = lineNodes[ln];
      const nodeDistance = this._getASTDistance(node, sourceStartLine, sourceStartCol, lineNode);
      if (nodeDistance <= leastDistance) {
        leastDistance = nodeDistance;
        closestNode = lineNode;
      }
    }
    return closestNode;
  }
  _getASTDistance (destNode, srcStartLine, srcStartCol, srcNode) {
    let typeDiffCost = 0;
    if (destNode.type !== srcNode.type) {
      switch (destNode.type) {
        case "NumericLiteral":
        case "Literal":
          switch (srcNode.type) {
            case "NumericLiteral":
            case "Literal":
              break;
            default:
              typeDiffCost = 1;
          }
        default:
          typeDiffCost = 1;
      }
    }
    return (
      Math.abs(srcStartLine - srcNode.loc.start.line) +
      Math.abs(srcStartCol - srcNode.loc.start.column) +
      ((destNode.type === srcNode.type ? 0 : 1))
    );
  }
}
