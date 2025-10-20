// Shared mutable game state and helpers
import { Combatant } from './combatants.js';
import { PLAYER_MAX_HEARTS, HALF } from './constants.js';
import { ENEMIES, createEnemy } from './enemies.js';

// Small built-in fallback dictionary to allow immediate play
const BUILTIN_SMALL_SET = new Set([
  'a','an','and','are','as','at','be','by','can','do','for','go','had','has','have','he','her','him','his','i',
  'in','is','it','like','man','me','my','no','not','of','on','one','or','our','out','said','see','she','so',
  'the','their','them','then','there','they','this','to','two','up','use','was','we','well','were','what',
  'when','which','who','will','with','word','work','would','year','you','your','red','blue','green','day',
  'boy','girl','dog','cat','run','walk','play','read','write','big','small','good','bad'
]);

export const state = {
  player: new Combatant(PLAYER_MAX_HEARTS),
  currentEnemyIndex: 0,
  enemy: createEnemy(ENEMIES[0]),
  grid: [],
  selected: [],
  selectedSet: new Set(),
  gameOver: false,
  refillAnimSet: new Set(),

  // Log
  logLines: [],
  logCollapsed: true,

  // Run stats
  runStats: {
    longestWord: '',
    longestLen: 0,
    highestAttackWord: '',
    highestAttackHalves: 0,
    mostEffectsWord: '',
    mostEffectsCount: 0,
  },

  // Equipment/effects
  activeEffects: {
    holyVowel: false,
    fireproof: false,
    healingStaff: false,
    redEnhanced: false,
    grayGoggles: false,
    fireWarAxe: false,
    frozenArmor: false,
  },
  shopSelectionMade: false,
  equippedItems: [],

  // Enemy status
  nextEnemyAttackHalved: false,
  enemySpecial: { every: null, countdown: null },

  // Dictionary
  dictionarySet: BUILTIN_SMALL_SET,
};

export function setDictionarySet(set) {
  if (set && set.size) state.dictionarySet = set;
}

export function advanceEnemy() {
  state.currentEnemyIndex = (state.currentEnemyIndex + 1) % ENEMIES.length;
  state.enemy = createEnemy(ENEMIES[state.currentEnemyIndex]);
}

export function resetEnemyToFirst() {
  state.currentEnemyIndex = 0;
  state.enemy = createEnemy(ENEMIES[0]);
}

export function clampPlayerHP() {
  const maxHalves = state.player.maxHearts * HALF;
  if (state.player.hp > maxHalves) state.player.hp = maxHalves;
}

export function clearSelectionState() {
  state.selected = [];
  state.selectedSet.clear();
}

export function initEnemySpecial() {
  if (state.enemy && state.enemy.special && state.enemy.special.every) {
    state.enemySpecial.every = Math.max(1, state.enemy.special.every | 0);
    state.enemySpecial.countdown = state.enemySpecial.every;
  } else {
    state.enemySpecial.every = null;
    state.enemySpecial.countdown = null;
  }
}