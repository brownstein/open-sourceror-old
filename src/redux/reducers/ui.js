import {
  OPEN_MODAL,
  CLOSE_MODAL
} from "../constants/ui";

const INITIAL_STATE = {
  modalStack: []
};

export default function uiReducer(state = INITIAL_STATE, action) {
    switch (action.type) {
      case OPEN_MODAL:
        return {
          ...state,
          modalStack: state.modalStack.concat([{
            modalName: action.modalName,
            modalProps: action.modalProps
          }])
        };
      case CLOSE_MODAL:
        return {
          ...state,
          modalStack: state.modalStack.slice(0, state.modalStack.length - 1)
        };
      default:
        return state;
    }
}
