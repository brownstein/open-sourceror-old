import { useEffect } from "react";
import { compose } from "react-redux";
import { closeModal } from "src/redux/actions/ui";
import useKey from "src/components/hooks/use-key";

import "./base.less";

export default function Modal({
  allowClose = true,
  modalClassName = null,
  children
}) {
  const { dispatch } = this.props;
  useKey("Escape", () => (allowClose && dispatch(closeModal())));

  return (
    <div className="modal-overlay">
      <div className={modalClassName || "modal"}>
        { children }
      </div>
    </div>;
  )
}

export default compose()(Modal);
