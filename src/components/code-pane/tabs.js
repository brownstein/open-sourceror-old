import { useState, useEffect, useRef } from "react";

import CodeExecutor from "./code-executor";
import Console from "./console";

import "./tabs.less";

const SPLIT_PANE_TRANSITION_POINT = 650;

export default function CodeConsoleTabs() {
  const containerRef = useRef(null);
  const [isSplit, setSplit] = useState(false);
  useEffect(() => {

    function onResize() {
      const { width } = containerRef.current.getBoundingClientRect();
      if (width >= SPLIT_PANE_TRANSITION_POINT) {
        setSplit(true);
      }
      else {
        setSplit(false);
      }
    }

    onResize();

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (isSplit) {
    return (
      <div ref={containerRef} className="code-and-console split">
        <CodeExecutor/>
        <Console/>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="code-and-console tabs">
      <div className="tabs">
        [Editor] | [Console]
      </div>
      <div className="content">
        <CodeExecutor/>
      </div>
    </div>
  );
}
