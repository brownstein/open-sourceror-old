export const INITIAL_PANE_STATE = {
  editorOpen: true,
};

export default function panesReducer (state = INITIAL_PANE_STATE, action) {
  switch (action.type) {
    case "resize":
      return state;
    default:
      return state;
  }
}
