// Game lifecycle and orchestration
import { HALF, PLAYER_MAX_HEARTS } from './constants.js';
import { ENEMIES } from './enemies.js';
import { state, initEnemySpecial, clearSelectionState, advanceEnemy, resetEnemyToFirst, clampPlayerHP } from './state.js';
import { submitBtn, shuffleBtn, newGameBtn } from './dom.js';
import { renderHearts, updateEnemyNameUI, updateEnemyStatusUI, renderEquipment, message, log, renderLog } from './ui.js';
import { initGrid, renderGrid } from './grid.js';
import { resetSpawnBias } from './tiles.js';
import { openShop } from './shop.js';
import { openEnding } from './endings.js';
import { clearRunStats, showRunStats } from './stats.js';

export function resetItemsAndEffects() {
  state.activeEffects.holyVowel = false;
  state.activeEffects.fireproof = false;
  state.activeEffects.healingStaff = false;
  state.activeEffects.redEnhanced = false;
  state.activeEffects.grayGoggles = false;
  state.activeEffects.fireWarAxe = false;
  state.activeEffects.frozenArmor = false;

  resetSpawnBias();

  state.equippedItems = [];
  renderEquipment();

  state.player.maxHearts = PLAYER_MAX_HEARTS;
  clampPlayerHP();
  renderHearts();
}

export function gameWon() {
  state.gameOver = true;
  const isFinal = state.currentEnemyIndex === ENEMIES.length - 1;
  message(isFinal ? 'You win! Final enemy defeated.' : 'You win! Enemy defeated.', '');
  log('🏆 Victory! You defeated the enemy.');
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;

  if (isFinal) {
    openEnding();
  } else {
    openShop();
  }
}

// Mode label helper
function currentModeLabel() {
  const m = state.difficultyMultiplier || 1;
  if (Math.abs(m - 2.0) < 0.01) return 'Extreme';
  if (Math.abs(m - 1.5) < 0.01) return 'Hard';
  return 'Normal';
}

export function gameLost() {
  state.gameOver = true;
  const mode = currentModeLabel();
  message(`You were defeated (${mode} mode). Try again.`, 'bad');
  log(`💀 Defeat (${mode} mode). The enemy outlasted you.`);
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;
  showRunStats('Run stats');
  newGameBtn.style.display = 'inline-block';
}

export function resetGame() {
  state.gameOver = false;

  state.nextEnemyAttackHalved = false;

  advanceEnemy();

  initEnemySpecial();
  updateEnemyNameUI();
  updateEnemyStatusUI();

  renderHearts();
  clearSelectionState();
  initGrid();
  renderGrid();
  submitBtn.disabled = false;
  shuffleBtn.disabled = false;
  newGameBtn.style.display = 'none';
  message('');
  log(`New game started. Enemy: ${state.enemy.name}.`);
}

export function startNewRun() {
  state.gameOver = false;
  clearRunStats();
  resetItemsAndEffects();
  state.nextEnemyAttackHalved = false;

  resetEnemyToFirst();

  initEnemySpecial();
  updateEnemyNameUI();
  updateEnemyStatusUI();

  clearSelectionState();
  initGrid();
  renderGrid();
  renderHearts();
  submitBtn.disabled = false;
  shuffleBtn.disabled = false;
  newGameBtn.style.display = 'none';
  message('');
  state.logLines.length = 0;
  renderLog();
  log(`New run started. Enemy: ${state.enemy.name}.`);
}

// Difficulty modes
export function startNewRunHard() {
  state.difficultyMultiplier = 1.5;
  startNewRun();
  log('Hard mode: enemies have 1.5× HP.');
}

export function startNewRunExtreme() {
  state.difficultyMultiplier = 2.0;
  startNewRun();
  log('Extreme mode: enemies have 2× HP.');
}