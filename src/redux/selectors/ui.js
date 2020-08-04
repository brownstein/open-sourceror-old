export const anyModalsOpen = state => !!state.ui.modalStack.length;

export const canOpenPauseMenu = state => {
  return !state.ui.modalStack.find(modal => modal.modalName === 'PAUSE');
};
