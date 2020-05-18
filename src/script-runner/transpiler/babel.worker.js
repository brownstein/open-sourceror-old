import * as babel from "@babel/core";

// make sure we're including everything we need in the bundle
import transformArrowFunctions from "@babel/plugin-transform-arrow-functions";

/**
 * Expensive transpilation function
 */
function justTranspile (event) {
  const rawCode = event.data;

  babel.transform(
    rawCode,
    {
      plugins: [
        transformArrowFunctions,
        // "@babel/plugin-transform-arrow-functions",
      ],
      presets: [],
      ast: true,
      generatorOpts: {
        sourceMaps: true
      }
    },
    (error, result) => {
      if (error) {
        self.postMessage({ error });
        return;
      }

      const rawAST = result.ast;
      const transpiledCode = result.code;
      const sourceMap = result.map;

      self.postMessage({ result: [rawAST, transpiledCode, sourceMap] });
    }
  );
}

// hook into message call
self.addEventListener("message", justTranspile);
