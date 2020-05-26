import {
  SET_PLAYER_STATUS,
  SET_PLAYER_HEALTH,
  SET_PLAYER_MANA,
  SET_PLAYER_MAX_HEALTH,
  SET_PLAYER_MAX_MANA,
  INCREMENT_PLAYER_HEALTH,
  INCREMENT_PLAYER_MANA
} from "src/redux/constants/status";

export function setPlayerStatus(health, maxHealth, mana, maxMana) {
  return {
    type: SET_PLAYER_STATUS,
    health,
    maxHealth,
    mana,
    maxMana
  };
}

export const setPlayerHealth = health => ({
  type: SET_PLAYER_HEALTH,
  health
});

export const setPlayerMana = mana => ({
  type: SET_PLAYER_MANA,
  mana
});

export const setPlayerMaxHealth = maxHealth => ({
  type: SET_PLAYER_MAX_HEALTH,
  maxHealth
});

export const setPlayerMaxMana = maxMana => ({
  type: SET_PLAYER_MAX_MANA,
  maxMana
});

export const incrementPlayerHealth = helath => ({
  type: INCREMENT_PLAYER_HEALTH,
  health
});

export const incrementPlayerMana = mana => ({
  type: INCREMENT_PLAYER_MANA,
  mana
});
