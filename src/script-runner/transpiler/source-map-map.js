import vlq from "vlq";

/**
 * Helper class for translating transpiled locations back to their sources
 */
export default class SourceMapMap {
  constructor (sourceMap) {
    this.mapsByLine = {};
    let sourceLine = 1;
    let sourceColumn = 0;
    let destLine = 1;
    sourceMap.mappings.split(";").forEach(encodedLine => {
      this.mapsByLine[destLine] = [];
      let destColumn = 0;
      encodedLine.split(",").forEach(part => {
        // empty parts should have zeroed columns but match lines
        if (part === "") {
          this.mapsByLine[destLine].push({
            destColumn: 0,
            sourceColumn: 0,
            sourceLine
          });
          return;
        }
        const [
          destColumnIncr,
          sourceFile,
          sourceLineIncr,
          sourceColumnIncr
        ] = vlq.decode(part);
        destColumn += destColumnIncr || 0;
        sourceLine += sourceLineIncr || 0;
        sourceColumn += sourceColumnIncr || 0;
        this.mapsByLine[destLine].push({
          destColumn,
          sourceLine,
          sourceColumn
        });
      });
      destLine++;
    });
  }
  getSourceLocation ({ line, column }) {
    const lineMap = this.mapsByLine[line];
    if (!lineMap) {
      return { line: 0, column: 0 };
    }
    let lastColumn = 0;
    let lastSourceLine = 0;
    let lastSourceColumn = 0;
    for (let i = 0; i < lineMap.length; i++) {
      const { destColumn, sourceLine, sourceColumn } = lineMap[i];
      if (destColumn >= column) {
        return { line: sourceLine || 0, column: sourceColumn || 0 };
      }
      lastSourceLine = sourceLine || 0;
      lastSourceColumn = sourceColumn || 0;
    }
    return { line: lastSourceLine, column: lastSourceColumn };
  }
}
