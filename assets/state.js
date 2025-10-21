// Shared mutable game state and helpers
import { Combatant } from './combatants.js';
import { PLAYER_MAX_HEARTS, HALF } from './constants.js';
import { ENEMIES, createEnemy } from './enemies.js';

export const state = {
  player: new Combatant(PLAYER_MAX_HEARTS),
  currentEnemyIndex: 0,
  enemy: createEnemy(ENEMIES[0]),
  grid: [],
  selected: [],
  selectedSet: new Set(),
  gameOver: false,
  refillAnimSet: new Set(),
  // Rows dropped per tile position during gravity phase: Map<'r,c', number>
  dropAnimRowsMap: new Map(),
  keyboardFocus: { r: 0, c: 0 },

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
    // New effects
    ignoreFrozenPenalty: false, // Ice Pick
    grayGambit: false,          // Grayscale Gambit
    crimsonEcho: false,         // Crimson Echo
    herbalSurge: false,         // Herbal Surge
    doublingDoubloon: false,    // Doubling Doubloon
    jqzxExpert: false,          // JQZX Expert
    scrabbler: false,           // Scrabbler
    palindromer: false,         // Palindromer
  },
  shopSelectionMade: false,
  equippedItems: [],

  // Enemy status
  nextEnemyAttackHalved: false,
  enemySpecial: { every: null, countdown: null },

  // Momentum tracking for Crimson Echo
  redEchoChain: 0,

  // Difficulty (HP scaling for enemies)
  difficultyMultiplier: 1,

  // Dictionary: null until loaded successfully
  dictionarySet: null,
};

export function setDictionarySet(set) {
  if (set && set.size) state.dictionarySet = set;
}

function applyEnemyDifficultyScaling() {
  const mult = state.difficultyMultiplier || 1;
  if (!state.enemy) return;
  const scaledMax = Math.ceil(state.enemy.maxHearts * mult);
  state.enemy.maxHearts = scaledMax;
  state.enemy.hp = scaledMax * HALF; // set to full HP under new max
}

export function advanceEnemy() {
  state.currentEnemyIndex = (state.currentEnemyIndex + 1) % ENEMIES.length;
  state.enemy = createEnemy(ENEMIES[state.currentEnemyIndex]);
  applyEnemyDifficultyScaling();
}

export function resetEnemyToFirst() {
  state.currentEnemyIndex = 0;
  state.enemy = createEnemy(ENEMIES[0]);
  applyEnemyDifficultyScaling();
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