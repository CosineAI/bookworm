// Run statistics
import { state } from './state.js';
import { log } from './ui.js';

export function clearRunStats() {
  state.runStats.longestWord = '';
  state.runStats.longestLen = 0;
  state.runStats.highestAttackWord = '';
  state.runStats.highestAttackHalves = 0;
  state.runStats.mostEffectsWord = '';
  state.runStats.mostEffectsCount = 0;
}

export function updateStats(word, attackHalves, effects) {
  if (!word) return;
  const len = word.length;
  if (len > state.runStats.longestLen) {
    state.runStats.longestLen = len;
    state.runStats.longestWord = word;
  }
  if (attackHalves > state.runStats.highestAttackHalves) {
    state.runStats.highestAttackHalves = attackHalves;
    state.runStats.highestAttackWord = word;
  }
  const effectCount = effects ? (effects instanceof Set ? effects.size : effects.length || 0) : 0;
  if (effectCount > state.runStats.mostEffectsCount) {
    state.runStats.mostEffectsCount = effectCount;
    state.runStats.mostEffectsWord = word;
  }
}

export function showRunStats(title = 'Run stats') {
  log(`— ${title} —`);
  const hearts = (state.runStats.highestAttackHalves || 0) / 2;
  log(`• Longest word: ${state.runStats.longestWord ? state.runStats.longestWord.toUpperCase() : '(none)'} (${state.runStats.longestLen})`);
  log(`• Highest attack: ${state.runStats.highestAttackWord ? state.runStats.highestAttackWord.toUpperCase() : '(none)'} (${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 || hearts === 0.5 ? '' : 's'})`);
  log(`• Most effects: ${state.runStats.mostEffectsWord ? state.runStats.mostEffectsWord.toUpperCase() : '(none)'} (${state.runStats.mostEffectsCount})`);
}