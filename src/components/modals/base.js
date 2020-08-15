import { useEffect } from "react";
import { connect } from "react-redux";
import { closeModal } from "src/redux/actions/ui";
import useKey from "src/components/hooks/use-key";

import "./base.less";

function Modal({
  allowClose = true,
  modalClassName = null,
  children,
  dispatchCloseModal
}) {
  useKey("Escape", () => (allowClose && dispatchCloseModal()));

  return (
    <div className="modal-overlay">
      <div className={modalClassName || "modal"}>
        <div className="modal-close-btn" onClick={dispatchCloseModal}>X</div>
        { children }
      </div>
    </div>
  );
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseModal: () => dispatch(closeModal())
  };
}

export default connect(null, mapDispatchToProps)(Modal);
