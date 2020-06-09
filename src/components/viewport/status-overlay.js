import { useContext } from "react";
import { connect } from "react-redux";

import { EngineContext } from "src/components/engine";

import "./status-overlay.less";

function StatusOverlay({
  health,
  maxHealth,
  mana,
  maxMana
}) {
  const engine = useContext(EngineContext);
  const healthStyle = {
    width: `${100 * health / maxHealth}%`
  };
  const manaStyle = {
    width: `${100 * mana / maxMana}%`
  };
  return (
    <div className="status-overlay">
      <div className="health-bar">
        <div className="bar" style={healthStyle} />
      </div>
      <div className="mana-bar">
        <div className="bar" style={manaStyle} />
      </div>
    </div>
  );
}

// redux state connector
function mapStateToProps(state) {
  const { status } = state;
  const {
    health,
    maxHealth,
    mana,
    maxMana
  } = status;
  return {
    health,
    maxHealth,
    mana,
    maxMana
  };
}

export default connect(mapStateToProps)(StatusOverlay);
