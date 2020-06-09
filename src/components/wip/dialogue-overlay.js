import { useContext } from "react";
import { connect } from "react-redux";

import { EngineContext } from "src/components/engine";

import "./dialogue-overlay.less";

function DialogueOverlay({
  dialogueMessage,
  continueAction
}) {
  const engine = useContext(EngineContext);
  return (
    <div className="viewport-dialogue-overlay">
      <div>
        { dialogueMessage }
      </div>
    </div>
  );
}

function mapStateToProps(state) {

}

export default connect(mapStateToProps)(DialogueOverlay);
