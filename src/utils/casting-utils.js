import { vec2 } from "p2";

/**
 * Casts a direction specified in a spell to a Vec2
 */
export function castDirectionToVec2(direction) {
  const result = vec2.create();

  // numeric tangent direction
  if (typeof direction === "number") {
    result[0] = Math.cos(direction);
    result[1] = Math.sin(direction);
    return result;
  }

  // array style direction
  if (Array.isArray(direction) || direction instanceof Float32Array) {
    vec2.copy(result, direction);
    return result;
  }

  // { x, y } style direction
  if (direction && direction.x && direction.y) {
    result[0] = direction.x;
    result[1] = direction.y;
    return result;
  }

  // worst-case fallback
  return null;
}

/**
 * Helper for getting options from a given object passed into a spell
 */
export function getOptionsFromObjectWithDefaults(passedOptions, defaults) {
  if (!passedOptions) {
    return getOptionsFromObjectWithDefaults({}, defaults);
  }

  const options = {};
  Object.keys(defaults).forEach(k => {
    const defaultSpec = defaults[k];
    let defaultValue = defaultSpec;
    let defaultProcessor = null;
    if (Array.isArray(defaultSpec)) {
      defaultValue = defaultSpec[0],
      defaultProcessor = defaultSpec[1];
    }
    if (passedOptions[k] === undefined) {
      options[k] = defaultValue;
    }
    else {
      options[k] = passedOptions[k];
    }
    if (defaultProcessor) {
      options[k] = defaultProcessor(options[k]);
    }
  });

  return options;
}
