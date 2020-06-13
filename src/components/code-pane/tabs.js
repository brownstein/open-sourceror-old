import { useState, useEffect, useRef } from "react";

import CodeExecutor from "./code-executor";
import Console from "./console";

import "./tabs.less";

const SPLIT_PANE_TRANSITION_POINT = 650;

export default function CodeConsoleTabs() {
  const containerRef = useRef(null);
  const [isSplit, setSplit] = useState(false);
  const [currentTab, setCurrentTab] = useState("editor");
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
        <Tab
          selected={currentTab === "editor"}
          onClick={() => setCurrentTab("editor")}
          >
          Code Editor
        </Tab>
        <Tab
          selected={currentTab === "console"}
          onClick={() => setCurrentTab("console")}
          >
          Console Output
        </Tab>
      </div>
      <div className="content">
        { currentTab === "editor" ? <CodeExecutor/> : <Console/> }
      </div>
    </div>
  );
}

const Tab = ({ children, selected, onClick }) => (
  <span className={ selected ? "tab selected" : "tab" } onClick={onClick}>
    {children}
  </span>
);
