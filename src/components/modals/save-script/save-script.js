import { useState } from "react";
import { connect } from "react-redux";

import { closeModal } from "src/redux/actions/ui"
import { addScriptToLibrary } from "src/redux/actions/scripts";

import BaseModal from "../base";
import "src/less/forms.less";

import "./save-script.less";

function SaveScriptModal({
  scriptContents,
  scriptLibrary,
  dispatch
}) {
  const [state, setState] = useState({
    spellName: ""
  });
  const {
    spellName
  } = state;
  const isValid = !!spellName;

  const updateName = (e) => setState({
    ...state,
    spellName: e.target.value
  });
  const selectScript = s => setState({
    ...state,
    spellName: s.scriptName
  });
  const saveScript = () => {
    dispatch(addScriptToLibrary({
      scriptName: spellName,
      scriptContents
    }));
    dispatch(closeModal());
  }

  return (
    <BaseModal>
      <h2>Save Script</h2>
      <div className="form-items">
        <div>
          <label>
            Spell Name:
            <input type="text" value={spellName} onChange={updateName}/>
          </label>
        </div>
        <div className="filler"></div>
      </div>
      <div><button onClick={saveScript}>save</button></div>
    </BaseModal>
  );
}

function mapStateToProps(state) {
  const { scriptLibrary } = state.scripts;
  const sortedScripts = [...scriptLibrary];
  sortedScripts.sort((a, b) => a.scriptName > b.scriptName);
  return {
    scriptLibrary: sortedScripts,
  };
}

export default connect(mapStateToProps)(SaveScriptModal);
