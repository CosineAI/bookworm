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