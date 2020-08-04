import { connect } from "react-redux";
import {
  PAUSE,
  SAVE_SCRIPT,
  LOAD_SCRIPT,
  MANAGE_SCRIPTS
} from "src/redux/constants/ui";
import pauseMenu from "./pause-menu/pause-menu";
import saveScript from "./save-script/save-script";

const MODALS = {
  [PAUSE]: pauseMenu,
  [SAVE_SCRIPT]: saveScript
};

function ModalsDisplay({
  modals
}) {
  if (!modals.length) {
    return null;
  }
  const openModal = modals[modals.length - 1];
  const {
    modalName,
    modalProps
  } = openModal;

  const Modal = MODALS[modalName];

  return <Modal {...modalProps}/>;
}

function mapStateToProps(state) {
  return {
    modals: state.ui.modalStack
  };
}

export default connect(mapStateToProps)(ModalsDisplay);
