import {
  OPEN_MODAL,
  CLOSE_MODAL,
  PAUSE,
  SAVE_SCRIPT,
  LOAD_SCRIPT,
  MANAGE_SCRIPTS
} from "../constants/ui";
import {
  canOpenPauseMenu
} from "../selectors/ui";

export const openModal = (modalName, modalProps = {}) => ({
  type: OPEN_MODAL,
  modalName,
  modalProps
});

export const closeModal = () => ({
  type: CLOSE_MODAL
});

const noop = () => ({ type: null });

export const openPauseMenu = () => {
  if (canOpenPauseMenu) {
    return openModal(PAUSE);
  }
  return noop();
}

export const openSaveScriptMenu = (scriptContents) => openModal(
  SAVE_SCRIPT,
  { scriptContents }
);

export const openManageScriptsMenu = () => openModal(MANAGE_SCRIPTS);
