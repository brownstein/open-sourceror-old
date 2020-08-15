import { useState } from "react";
import { connect } from "react-redux";

import { addScriptToLibrary } from "src/redux/actions/scripts";

import BaseModal from "../base";
import "src/less/forms.less";

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

  const updateName = (e) => setState({ ...state, spellName: e.target.value });
  const saveScript = () => dispatch(addScriptToLibrary({
    scriptName: spellName,
    scriptContents
  }));

  return (
    <BaseModal>
      <h2>Save Script</h2>
      <div>
        <label>
          Spell Name:
          <input type="text" value={spellName} onChange={updateName}/>
        </label>
      </div>
      <div>
        <label>Existing Scripts</label>
        <div className="existing-scripts-display">
          {
            scriptLibrary.map(s => (
              <div key={s.id} className="existing-script-name">
                Script: {s.scriptName}
              </div>
            ))
          }
        </div>
      </div>
      <div><button onClick={saveScript}>save</button></div>
    </BaseModal>
  );
}

function mapStateToProps(state) {
  return {
    scriptLibrary: state.scripts.scriptLibrary,
  };
}

export default connect(mapStateToProps)(SaveScriptModal);
