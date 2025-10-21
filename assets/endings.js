// Ending overlay
import { state } from './state.js';
import {
  endingOverlay,
  endingEnemyNameEl,
  endingLongestEl,
  endingHighestEl,
  endingEffectsEl,
} from './dom.js';
import { formatHearts } from './ui.js';
// Defeat overlay imports
import {
  defeatOverlay,
  defeatEnemyNameEl,
  defeatLongestEl,
  defeatHighestEl,
  defeatEffectsEl,
} from './dom.js';

export function openEnding() {
  if (endingEnemyNameEl) endingEnemyNameEl.textContent = state.enemy?.name || 'Enemy';
  if (endingLongestEl) {
    const w = state.runStats.longestWord ? state.runStats.longestWord.toUpperCase() : '(none)';
    const len = state.runStats.longestLen || 0;
    endingLongestEl.textContent = `${w}${len ? ` (${len} letters)` : ''}`;
  }
  if (endingHighestEl) {
    const w = state.runStats.highestAttackWord ? state.runStats.highestAttackWord.toUpperCase() : '(none)';
    const halves = state.runStats.highestAttackHalves || 0;
    endingHighestEl.textContent = `${w}${halves ? ` (${formatHearts(halves)})` : ''}`;
  }
  if (endingEffectsEl) {
    const w = state.runStats.mostEffectsWord ? state.runStats.mostEffectsWord.toUpperCase() : '(none)';
    const count = state.runStats.mostEffectsCount || 0;
    endingEffectsEl.textContent = `${w}${count ? ` (${count} effect${count === 1 ? '' : 's'})` : ''}`;
  }
  if (endingOverlay) {
    endingOverlay.classList.add('show');
    endingOverlay.setAttribute('aria-hidden', 'false');
  }
}

export function closeEnding() {
  if (endingOverlay) {
    endingOverlay.classList.remove('show');
    endingOverlay.setAttribute('aria-hidden', 'true');
  }
}

// Defeat overlay open/close
export function openDefeat() {
  if (defeatEnemyNameEl) defeatEnemyNameEl.textContent = state.enemy?.name || 'Enemy';
  if (defeatLongestEl) {
    const w = state.runStats.longestWord ? state.runStats.longestWord.toUpperCase() : '(none)';
    const len = state.runStats.longestLen || 0;
    defeatLongestEl.textContent = `${w}${len ? ` (${len} letters)` : ''}`;
  }
  if (defeatHighestEl) {
    const w = state.runStats.highestAttackWord ? state.runStats.highestAttackWord.toUpperCase() : '(none)';
    const halves = state.runStats.highestAttackHalves || 0;
    defeatHighestEl.textContent = `${w}${halves ? ` (${formatHearts(halves)})` : ''}`;
  }
  if (defeatEffectsEl) {
    const w = state.runStats.mostEffectsWord ? state.runStats.mostEffectsWord.toUpperCase() : '(none)';
    const count = state.runStats.mostEffectsCount || 0;
    defeatEffectsEl.textContent = `${w}${count ? ` (${count} effect${count === 1 ? '' : 's'})` : ''}`;
  }
  if (defeatOverlay) {
    defeatOverlay.classList.add('show');
    defeatOverlay.setAttribute('aria-hidden', 'false');
  }
}

export function closeDefeat() {
  if (defeatOverlay) {
    defeatOverlay.classList.remove('show');
    defeatOverlay.setAttribute('aria-hidden', 'true');
  }
}