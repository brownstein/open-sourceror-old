import { useState, useEffect, useContext } from "react";

import { EngineContext } from "./engine";

import "./loading-screen.less";

export default function LoadingScreen({ children }) {
  const engine = useContext(EngineContext);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
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
  }, []);

  if (loading) {
    return <div className="full-loading-screen"><span>LOADING...</span></div>;
  }

  return children;
}
