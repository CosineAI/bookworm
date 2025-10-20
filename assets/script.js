// Entry point: orchestrates modules
import { TILE_TYPES } from './constants.js';
import { loadEnglishDictionary } from './dictionary.js';
import {
  gridEl,
  submitBtn,
  clearBtn,
  shuffleBtn,
  newGameBtn,
  logToggleBtn,
  healBtn,
  equipItem1Btn,
  equipItem2Btn,
  continueBtn,
  endingRestartBtn,
} from './dom.js';
import { state, setDictionarySet, initEnemySpecial } from './state.js';
import { renderHearts, updateEnemyNameUI, updateEnemyStatusUI, renderEquipment, log, renderLog, message, updateWordUI, attachGridKeyboard } from './ui.js';
import { initGrid, renderGrid, onTileClick, clearSelection, refillUsedTiles, shuffleGrid, getCurrentWord } from './grid.js';
import { enemyAttack, playerAttack } from './combat.js';
import { computeAttackInfo } from './compute.js';
import { openShop, closeShop, selectHeal, equipItem } from './shop.js';
import { closeEnding } from './endings.js';
import { updateStats } from './stats.js';
import { resetGame, startNewRun, gameWon, gameLost } from './game.js';

function isValidWord(w) {
  if (!w || w.length < 2) return false;
  return state.dictionarySet ? state.dictionarySet.has(w) : false;
}

async function initDictionary() {
  submitBtn.disabled = false;
  console.log('[Dictionary] Loading… fallback active until remote dictionary is ready.');
  try {
    const res = await loadEnglishDictionary();
    setDictionarySet(res.set);
    if (res.isFallback) {
      console.warn(`[Dictionary] Fallback loaded: ${res.info}`);
    } else {
      console.log(`[Dictionary] Loaded: ${res.info}`);
    }
  } catch (e) {
    console.warn('[Dictionary] Fetch failed. Using built-in fallback list.', e && e.message ? e.message : '');
  }
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
  startNewRun();
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
  startNewRun();
});

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