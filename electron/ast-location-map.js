"use strict";

/**
 * Helper class for getting the closest AST node to a given location pair
 */
class ASTLocationMap {
  constructor () {
    this.nodesByLine = {};
  }
  addASTNode (node) {
    const start = node.loc.start;
    const end = node.loc.end;
    for (let line = start.line; line <= end.line; line++) {
      if (!this.nodesByLine[line]) {
        this.nodesByLine[line] = [];
      }
      this.nodesByLine[line].push(node);
    }
  }
  getClosestNode (start, end) {
    const startLine = start.line;
    const endLine = end.line;
    let leastDistance = Infinity;
    let closestNode = null;
    for (let line = startLine; line <= endLine; line++) {
      const lineNodes = this.nodesByLine[line];
      if (!lineNodes) {
        continue;
      }
      for (let ln = 0; ln < lineNodes.length; ln++) {
        const lineNode = lineNodes[ln];
        const nodeDistance = this._getASTDistance(startPos, endPos, lineNode.start, lineNode.end);
        if (nodeDistance <= leastDistance) {
          leastDistance = nodeDistance;
          closestNode = lineNode;
        }
      }
    }
    return closestNode;
  }
  _getASTDistance (start1, end1, start2, end2) {
    return (
      Math.abs(start1.line   - start2.line) +
      Math.abs(start1.column - start2.column) +
      Math.abs(end1.line     - end2.line) +
      Math.abs(end1.column   - end2.column)
    );
  }
}

module.exports = ASTLocationMap;
