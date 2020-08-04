
import "./save-script.less";

export default function saveScriptModal({
  scriptContents
}) {
  return <div className="save-script-modal">
    <div>SAVE_SCRIPT</div>
    <div><input type="text"/></div>
    <pre>{scriptContents}</pre>
    <div><button>save</button></div>
  </div>;
}
