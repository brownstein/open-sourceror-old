import { connect } from "react-redux";

import "./console.less";

const Console = ({ lines }) => (
  <div className="console">
    {lines.map((l, i) => (
      <div key={i}>{l}</div>
    ))}
  </div>
);

function mapStateToProps(state) {
  const { scripts } = state;
  const { outputLines } = scripts;
  return {
    lines: outputLines
  };
}

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Console);
