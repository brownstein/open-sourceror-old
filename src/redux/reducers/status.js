import {
  SET_PLAYER_STATUS,
  SET_PLAYER_HEALTH,
  SET_PLAYER_MANA,
  SET_PLAYER_MAX_HEALTH,
  SET_PLAYER_MAX_MANA,
  INCREMENT_PLAYER_HEALTH,
  INCREMENT_PLAYER_MANA
} from "src/redux/constants/status";

const INITIAL_STATE = {
  health: 100,
  maxHealth: 100,
  mana: 100,
  maxMana: 100
};

export default function reduceStatus(state = INITIAL_STATE, action) {
  switch (action.type) {
      case SET_PLAYER_STATUS:
        return {
          ...state,
          health: action.health === null ? state.health : action.health,
          maxHealth: action.maxHealth === null ? state.maxHealth : action.maxHealth,
          mana: action.mana === null ? state.mana : action.mana,
          maxMana: action.maxMana === null ? state.maxMana : action.maxMana
        };
      case SET_PLAYER_HEALTH:
        return {
          ...state,
          health: action.health
        };
      case SET_PLAYER_MAX_HEALTH:
        return {
          ...state,
          maxHealth: action.health
        };
      case SET_PLAYER_MANA:
        return {
          ...state,
          mana: action.mana
        };
      case SET_PLAYER_MAX_MANA:
        return {
          ...state,
          maxMana: action.maxMana
        };
      case INCREMENT_PLAYER_HEALTH:
        return {
          ...state,
          health: Math.max(0, Math.min(
            state.maxHealth,
            state.health + action.health
          ))
        };
      case INCREMENT_PLAYER_MANA:
        return {
          ...state,
          mana: Math.max(0, Math.min(
            state.maxMana,
            state.mana + action.mana
          ))
        };
    default:
      return state;
  }
}
