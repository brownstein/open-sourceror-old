import { useEffect, useState, useContext } from "react";

// TODO: flesh this out if I decide to switch away from Redux
export function composeExecutionStateHOC(initialState, context, Component) {
  return function ComposedExecutionStateHOC(props) {
    const context = useContext(context);
    const [state, setState] = useState(initialState);
    useEffect(() => {
      return () => {
        // unbinding code here
      };
    }, []);
    return <Component {...props} {...state}/>;
  };
}
