import { useContext, useEffect } from "react";
import { ControllerContext } from "src/components/controller";

export function useTrackFocus() {
  const controllerContext = useContext(ControllerContext);

  // on cleanup, alert the controller that focus has changed
  useEffect(() => () => {
    const { engine } = controllerContext;
    engine.returnFocus();
  }, []);
}
