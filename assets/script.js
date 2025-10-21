// Entry point: orchestrates modules
import { TILE_TYPES } from './constants.js';
import { loadEnglishDictionary } from './dictionary.js';
import {
  gridEl,
  submitBtn,
  clearBtn,
  shuffleBtn,
  newGameBtn,
  newRunBtn,
  logToggleBtn,
  healBtn,
  equipItem1Btn,
  equipItem2Btn,
  continueBtn,
  endingRestartBtn,
  dictStatusEl,
  hardModeBtn,
  extremeModeBtn,
  rulesBtn,
  rulesOverlay,
  rulesCloseBtn,
} from './dom.js';
import { state, setDictionarySet, initEnemySpecial } from './state.js';
import { renderHearts, updateEnemyNameUI, updateEnemyStatusUI, renderEquipment, log, renderLog, message, updateWordUI, attachGridKeyboard } from './ui.js';
import { initGrid, renderGrid, onTileClick, clearSelection, refillUsedTiles, shuffleGrid, getCurrentWord } from './grid.js';
import { enemyAttack, playerAttack } from './combat.js';
import { computeAttackInfo } from './compute.js';
import { openShop, closeShop, selectHeal, equipItem } from './shop.js';
import { closeEnding } from './endings.js';
import { updateStats } from './stats.js';
import { resetGame, startNewRun, gameWon, gameLost, startNewRunHard, startNewRunExtreme } from './game.js';

function isValidWord(w) {
  if (!w || w.length < 2) return false;
  return state.dictionarySet ? state.dictionarySet.has(w) : false;
}

async function initDictionary() {
  // Keep Attack disabled until the dictionary is loaded
  if (dictStatusEl) dictStatusEl.textContent = 'Loading dictionary…';
  try {
    const res = await loadEnglishDictionary();
    setDictionarySet(res.set);
    if (dictStatusEl) dictStatusEl.textContent = res.info || 'Dictionary loaded';
    updateWordUI(); // re-evaluate button disabled state
  } catch (e) {
    if (dictStatusEl) dictStatusEl.textContent = 'Error accessing word database';
    message('Failed to load dictionary. Please check your connection.', 'bad');
    // Attack remains disabled because dictionarySet is null
  }
}

// UI: reflect current mode with a ring around the active button
function updateModeUI() {
  const m = state.difficultyMultiplier || 1;
  if (newRunBtn) newRunBtn.classList.toggle('mode-active', Math.abs(m - 1.0) < 0.01);
  if (hardModeBtn) hardModeBtn.classList.toggle('mode-active', Math.abs(m - 1.5) < 0.01);
  if (extremeModeBtn) extremeModeBtn.classList.toggle('mode-active', Math.abs(m - 2.0) < 0.01);
}

// Events
submitBtn.addEventListener('click', () => {
  if (state.gameOver) return;
  const w = getCurrentWord().toLowerCase();
  if (w.length < 2) {
    message('Select at least 2 letters.', 'bad');
    return;
  }
  if (!isValidWord(w)) {
    message(`“${w.toUpperCase()}” is not in the dictionary.`, 'bad');
    return;
  }
  message('');
  const used = [...state.selected];
  const { attackHalves, healHalves, effects } = computeAttackInfo();

  updateStats(w, attackHalves, effects);

  const poisonUsed = used.some(({ r, c }) => state.grid[r][c].type === TILE_TYPES.POISON);
  if (poisonUsed) {
    state.nextEnemyAttackHalved = true;
    log('☠️ You applied poison: the enemy’s next attack will be halved.');
    updateEnemyStatusUI();
  }

  const frozenUsed = used.some(({ r, c }) => state.grid[r][c].type === TILE_TYPES.FROZEN);

  clearSelection();
  const ended = playerAttack(w, attackHalves, healHalves);
  refillUsedTiles(used);
  if (ended) {
    gameWon();
  } else {
    if (frozenUsed) {
      log('❄️ Frozen tiles used: the enemy skips their turn.');
      updateEnemyStatusUI();
    } else {
      const playerDead = enemyAttack();
      if (playerDead) gameLost();
    }
  }
});

clearBtn.addEventListener('click', () => {
  clearSelection();
});

shuffleBtn.addEventListener('click', () => {
  if (state.gameOver) return;
  shuffleGrid();
  log('Shuffled letters. Passing turn...');
  const playerDead = enemyAttack();
  if (playerDead) gameLost();
});

newGameBtn.addEventListener('click', () => {
  // New Game resets to Normal mode
  state.difficultyMultiplier = 1;
  startNewRun();
  updateModeUI();
});

// Difficulty mode events
hardModeBtn.addEventListener('click', () => {
  startNewRunHard();
  updateModeUI();
});
extremeModeBtn.addEventListener('click', () => {
  startNewRunExtreme();
  updateModeUI();
});

// Shop events
healBtn.addEventListener('click', () => selectHeal());
equipItem1Btn.addEventListener('click', () => equipItem(0));
equipItem2Btn.addEventListener('click', () => equipItem(1));
continueBtn.addEventListener('click', () => {
  log('Shop: Skipped shop.');
  closeShop();
  window.dispatchEvent(new CustomEvent('shop:proceed'));
});

window.addEventListener('shop:proceed', () => {
  resetGame();
});

endingRestartBtn.addEventListener('click', () => {
  closeEnding();
  // Restart in Normal mode
  state.difficultyMultiplier = 1;
  startNewRun();
  updateModeUI();
});

// Rules modal toggle
function openRules() {
  if (!rulesOverlay) return;
  rulesOverlay.classList.add('show');
  rulesOverlay.setAttribute('aria-hidden', 'false');
}
function closeRules() {
  if (!rulesOverlay) return;
  rulesOverlay.classList.remove('show');
  rulesOverlay.setAttribute('aria-hidden', 'true');
}
if (rulesBtn) {
  rulesBtn.addEventListener('click', () => {
    const open = rulesOverlay && rulesOverlay.classList.contains('show');
    if (open) closeRules(); else openRules();
  });
}
if (rulesCloseBtn) {
  rulesCloseBtn.addEventListener('click', () => closeRules());
}
if (rulesOverlay) {
  rulesOverlay.addEventListener('click', (e) => {
    if (e.target === rulesOverlay) closeRules();
  });
}

// Log toggle
if (logToggleBtn) {
  logToggleBtn.addEventListener('click', () => {
    state.logCollapsed = !state.logCollapsed;
    logToggleBtn.textContent = state.logCollapsed ? 'Show full log' : 'Show last 5';
    renderLog();
  });
  logToggleBtn.textContent = 'Show full log';
}

// Keyboard access + grid click bridge
attachGridKeyboard();
window.addEventListener('grid:tile-click', (e) => {
  const { r, c } = e.detail || {};
  if (typeof r === 'number' && typeof c === 'number') onTileClick(r, c);
});

// New Run button
newRunBtn.addEventListener('click', () => {
  // Footer New Game resets to Normal mode
  state.difficultyMultiplier = 1;
  startNewRun();
  updateModeUI();
});

// Kick off
initGrid();
renderGrid();
renderHearts();
updateWordUI();
initDictionary();
initEnemySpecial();
updateEnemyNameUI();
updateEnemyStatusUI();
renderEquipment();
log(`Enemy: ${state.enemy.name}.`);
updateModeUI();