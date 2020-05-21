import { useState, useEffect } from "react";

import ScriptRunner from "../script-runner/script-runner";

// ace editor
// import AceEditor from "react-ace";
// import "ace-builds/webpack-resolver";
// import "ace-builds/src-noconflict/mode-javascript";
// import "ace-builds/src-noconflict/theme-tomorrow";

// source script to run - this gets transpiled from ES6 to normal ES5, then
// run inside of a JS-based JS interpreter so that it is totally sandboxed
const srcScript = `
async function transpiled (n) {
  if (n < 1) {
    return;
  }
  console.log(n);
  await Promise.all([
    transpiled(n - 1),
    transpiled(n - 2)
  ]);
  console.log(n, 'done');
}
transpiled(5);
`

export default function CodeExecutor () {
  const [state, setState] = useState({
    scriptRunner: null,
    highlightedTextSegment: [null, null],
    currentLine: null,
    editorContents: srcScript,
  });
  useEffect(() => {
    const scriptRunner = new ScriptRunner(srcScript);
    setState({ ...state, scriptRunner });
    let t = 0;
    function onFrame () {
      if (scriptRunner.ready && !(t++ % 2)) {
        if (!scriptRunner.hasNextStep) {
          return;
        }
        let highlightedTextSegment = [null, null];
        let start = null;
        let currentLine = null;
        let i = 0;
        while (!start && scriptRunner.hasNextStep() && i++ < 1000) {
          scriptRunner.doCurrentLine();
          highlightedTextSegment = scriptRunner.getExecutingSection();
          [start] = highlightedTextSegment;
          currentLine = scriptRunner.getExecutingLine();
        }
        setState(s => ({ ...s, highlightedTextSegment, currentLine }));
      }
      requestAnimationFrame(onFrame);
    }
    onFrame();
  }, []);
  const { highlightedTextSegment, currentLine } = state;
  const [start, end] = highlightedTextSegment;
  const parts = [];
  parts.push(srcScript.slice(0, start || 0));
  parts.push(<span key={1} className="highlighted">{srcScript.slice(start || 0, end || 0)}</span>);
  parts.push(srcScript.slice(end || 0, srcScript.length));
  let lineIndicator = null;
  if (currentLine) {
    const lineIndicatorStyle = {
      top: `${currentLine * 16 + 16}px`
    };
    lineIndicator = <span
      className="line-indicator"
      style={lineIndicatorStyle}
      >{">"}</span>;
  }
  const { editorContents } = state;
  return <div>
    <div className="script-display">{parts}{lineIndicator}</div>
    { null
    // <div>
    //   <AceEditor
    //     mode="javascript"
    //     theme="tomorrow"
    //     onChange={v => {
    //       console.log(v)
    //       setState(s => ({ ...s, editorContents: v }));
    //     }}
    //     name="ACE_DIV_NAME"
    //     value={editorContents}
    //     setOptions={{
    //       showLineNumbers: true,
    //       enableBasicAutocompletion: false,
    //       enableLiveAutocompletion: false,
    //     }}
    //     annotations={[{
    //       row: 2,
    //       type: 'info',
    //       text: 'executing here'
    //     }]}
    //   />
    // </div>
  }
  </div>;
}
