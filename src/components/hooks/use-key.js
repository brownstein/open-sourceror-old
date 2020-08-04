import { useEffect } from "react";

export default function useKey(key, behavior, cacheOn = []) {
  useEffect(() => {
    function keyListener(e) {
      if (e.key === key) {
        behavior();
      }
    }
    window.addEventListener("keyup", keyListener);
    return () => window.removeEventListener("keyup", keyListener);
  }, cacheOn);
}
