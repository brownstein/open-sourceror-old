import { useState, useEffect, useContext } from "react";

import { ControllerContext } from "./controller";

import "./loading-screen.less";

export default function LoadingScreen({ children }) {
  const { engine } = useContext(ControllerContext);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!engine) {
      return;
    }
    function onLoadingStarted() {
      setLoading(true);
    }
    function onLoadingFinished() {
      setLoading(false);
    }
    engine.getLoadingPromise().then(() => {
      setLoading(false);
    });
    engine.on("loadingAssets", onLoadingStarted);
    engine.on("everythingReady", onLoadingFinished);
    return () => {
      engine.off("loadingAssets", onLoadingStarted);
      engine.off("everythingReady", onLoadingFinished);
    };
  }, [engine]);

  if (loading) {
    return <div className="full-loading-screen"><span>LOADING...</span></div>;
  }

  return children;
}
