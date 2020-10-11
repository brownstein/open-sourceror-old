import { useState } from "react";
import { connect } from "react-redux";

import { closeModal } from "src/redux/actions/ui";
import { saveScript } from "src/redux/actions/scripts";

import ItemGrid from "src/components/items/item-grid";
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
  const saveSpell = () => {
    dispatch(saveScript({
      scriptName: spellName || "untitled",
      scriptContents
    }));
    dispatch(closeModal());
  }
  const onSelectItem = item => {
    setState({
      ...state,
      spellName: item.itemData.scriptName
    });
  };

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
        <div className="filler">
          <ItemGrid
            onClickItem={onSelectItem}
            enableItemTypes={["Scroll"]}
            />
        </div>
      </div>
      <div><button onClick={saveSpell}>save</button></div>
    </BaseModal>
  );
}

export default connect()(SaveScriptModal);
