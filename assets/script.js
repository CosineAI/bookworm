// Word Battle — Bookworm-like (Refactored to modules, ready for future mechanics)
import { GRID_SIZE, PLAYER_MAX_HEARTS, ENEMY_MAX_HEARTS, HALF, ENEMY_DAMAGE_HALVES, TILE_TYPES } from './constants.js';
import { makeTile, badgeFor } from './tiles.js';
import { loadEnglishDictionary } from './dictionary.js';
import { FALLBACK_WORDS } from './dictionaryFallback.js';
import { Combatant, Enemy } from './combatants.js';

// DOM
const gridEl = document.getElementById('grid');
const playerHeartsEl = document.getElementById('playerHearts');
const enemyHeartsEl = document.getElementById('enemyHearts');
const dictStatusEl = document.getElementById('dictStatus');
const messageEl = document.getElementById('message');
const currentWordEl = document.getElementById('currentWord');
const letterCountEl = document.getElementById('letterCount');
const attackValEl = document.getElementById('attackVal');
const attackDisplayEl = document.getElementById('attackDisplay');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const newGameBtn = document.getElementById('newGameBtn');
const logEl = document.getElementById('log');
const mainEl = document.querySelector('main');

// State
const player = new Combatant(PLAYER_MAX_HEARTS);
const enemy = new Enemy(ENEMY_MAX_HEARTS, ENEMY_DAMAGE_HALVES);
let grid = [];
let selected = [];         // array of {r, c}
let selectedSet = new Set();
let gameOver = false;
let refillAnimSet = new Set(); // positions to animate falling when refilled

// Dictionary
let dictionarySet = null;
let dictLoaded = false;
const fallbackSet = new Set(FALLBACK_WORDS);

// Grid helpers
function initGrid() {
  grid = Array.from({length: GRID_SIZE}, () =>
    Array.from({length: GRID_SIZE}, () => makeTile())
  );
}

function renderGrid() {
  gridEl.innerHTML = '';
  for (let r=0; r<GRID_SIZE; r++) {
    for (let c=0; c<GRID_SIZE; c++) {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.type = 'button';
      tile.setAttribute('data-pos', `${r},${c}`);
      const cell = grid[r][c];
      const typeClass = cell.type !== TILE_TYPES.NORMAL ? ` type-${cell.type}` : '';
      tile.className += typeClass;
      tile.setAttribute('aria-label', `Letter ${cell.ch}${cell.type !== TILE_TYPES.NORMAL ? ' ' + cell.type + ' tile' : ''}`);
      const badge = badgeFor(cell.type);
      tile.innerHTML = `<span class="ch">${cell.ch}</span>${badge ? `<span class="badge">${badge}</span>` : ''}`;
      const key = `${r},${c}`;
      if (selectedSet.has(key)) tile.classList.add('selected');
      if (refillAnimSet.has(key)) {
        tile.classList.add('fall-in');
        tile.style.animationDelay = `${r * 40}ms`; // small stagger per row
      }
      tile.addEventListener('click', () => onTileClick(r, c));
      gridEl.appendChild(tile);
    }
  }
  // Clear the set; animation classes are already applied to DOM nodes.
  refillAnimSet.clear();
}

function onTileClick(r, c) {
  if (gameOver) return;
  const key = `${r},${c}`;
  if (selectedSet.has(key)) {
    selectedSet.delete(key);
    selected = selected.filter(p => !(p.r === r && p.c === c));
  } else {
    selectedSet.add(key);
    selected.push({r, c});
  }
  updateWordUI();
  renderGridSelectionOnly();
}

function renderGridSelectionOnly() {
  // Fast toggle classes without rebuilding whole grid
  const children = gridEl.children;
  for (let i=0;i<children.length;i++) {
    const el = children[i];
    const key = el.getAttribute('data-pos');
    if (selectedSet.has(key)) el.classList.add('selected');
    else el.classList.remove('selected');
  }
}

function getCurrentWord() {
  return selected.map(p => grid[p.r][p.c].ch).join('');
}

function computeAttackInfo() {
  // returns { attackHalves, healHalves, letters }
  let attackHalves = 0;
  let healHalves = 0;
  const letters = selected.length;
  for (const p of selected) {
    const cell = grid[p.r][p.c];
    if (!cell) continue;
    switch (cell.type) {
      case TILE_TYPES.RED:
      case 'red':
        attackHalves += 2; // red deals double
        break;
      case TILE_TYPES.GREEN:
      case 'green':
        attackHalves += 1; // normal damage
        healHalves += 1;   // plus heal
        break;
      case TILE_TYPES.GRAY:
      case 'gray':
        attackHalves += 0; // no damage
        break;
      default:
        attackHalves += 1; // normal
    }
  }
  return { attackHalves, healHalves, letters };
}

function updateWordUI() {
  const w = getCurrentWord();
  currentWordEl.textContent = w || '(none)';
  const { attackHalves, letters } = computeAttackInfo();
  letterCountEl.textContent = String(letters);
  attackValEl.textContent = String(attackHalves);
  attackDisplayEl.textContent = String(attackHalves);
  submitBtn.disabled = gameOver || letters < 2; // require at least 2 letters
}

function clearSelection() {
  selected = [];
  selectedSet.clear();
  updateWordUI();
  renderGridSelectionOnly();
  message('');
}

function shuffleGrid() {
  if (gameOver) return;
  for (let r=0;r<GRID_SIZE;r++) {
    for (let c=0;c<GRID_SIZE;c++) {
      grid[r][c] = makeTile();
    }
  }
  clearSelection();
  renderGrid();
  log('Shuffled letters.');
}

function refillUsedTiles(used) {
  refillAnimSet.clear();
  for (const {r, c} of used) {
    grid[r][c] = makeTile();
    refillAnimSet.add(`${r},${c}`);
  }
  renderGrid();
}

// Hearts and messaging
function heartsString(currentHalves, maxHearts) {
  let s = '';
  const full = Math.floor(currentHalves / 2);
  const half = currentHalves % 2;
  for (let i=0; i<maxHearts; i++) {
    if (i < full) s += '❤️';
    else if (i === full && half) s += '💔';
    else s += '🤍';
  }
  return s;
}

function renderHearts() {
  playerHeartsEl.textContent = heartsString(player.hp, player.maxHearts);
  enemyHeartsEl.textContent = heartsString(enemy.hp, enemy.maxHearts);
}

function message(text, kind='') {
  messageEl.textContent = text || '';
  messageEl.style.color = kind === 'bad' ? '#b91c1c' : '#374151';
}

function floatDamage(targetEl, txt, kind='enemy') {
  const span = document.createElement('span');
  span.className = `damage-float ${kind}`;
  span.textContent = txt;
  const rect = targetEl.getBoundingClientRect();
  const hostRect = mainEl.getBoundingClientRect();
  span.style.left = `${rect.left - hostRect.left + rect.width/2 - 8}px`;
  span.style.top = `${rect.top - hostRect.top + 8}px`;
  mainEl.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}

function log(line) {
  const p = document.createElement('div');
  p.textContent = line;
  logEl.prepend(p);
}

// Game end
function gameWon() {
  gameOver = true;
  message('You win! Enemy defeated.', '');
  log('🏆 Victory! You defeated the enemy.');
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;
  newGameBtn.style.display = 'inline-block';
}

function gameLost() {
  gameOver = true;
  message('You were defeated. Try again.', 'bad');
  log('💀 Defeat. The enemy outlasted you.');
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;
  newGameBtn.style.display = 'inline-block';
}

// Combat
function enemyAttack() {
  if (gameOver) return;
  const dmg = enemy.damageHalvesPerTurn; // in half-hearts
  player.takeDamage(dmg);
  renderHearts();
  const hearts = dmg / 2;
  const label = hearts === 0.5 ? '−½' : `−${hearts}`;
  floatDamage(playerHeartsEl, label, 'player');
  log(`Enemy strikes for ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 ? '' : hearts === 0.5 ? '' : 's'}.`);
  if (player.isDead()) gameLost();
}

function playerAttack(word, attackHalves, healHalves) {
  const enemyBefore = enemy.hp;
  enemy.takeDamage(attackHalves);
  const heartsDealt = (enemyBefore - enemy.hp) / 2;
  renderHearts();
  floatDamage(enemyHeartsEl, `−${heartsDealt}${heartsDealt % 1 ? '' : ''}`, 'enemy');

  if (healHalves > 0) {
    const prev = player.hp;
    player.heal(healHalves);
    const healedHearts = (player.hp - prev) / 2;
    if (healedHearts > 0) {
      renderHearts();
      floatDamage(playerHeartsEl, `＋${healedHearts}${healedHearts % 1 ? '' : ''}`, 'heal');
    }
  }

  log(`You played “${word.toUpperCase()}” for attack ${attackHalves}. Enemy took ${heartsDealt} heart${heartsDealt===1? '':'s'}.`);

  if (enemy.isDead()) {
    gameWon();
    return true;
  }
  return false;
}

function submitWord() {
  if (gameOver) return;
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
  const used = [...selected];
  const { attackHalves, healHalves } = computeAttackInfo();
  clearSelection();
  const ended = playerAttack(w, attackHalves, healHalves);
  refillUsedTiles(used);
  if (!ended) enemyAttack();
}

function isValidWord(w) {
  if (!w || w.length < 2) return false;
  if (dictLoaded && dictionarySet) return dictionarySet.has(w);
  return fallbackSet.has(w);
}

// Dictionary loading (non-blocking: play allowed via fallback while it loads)
async function initDictionary() {
  dictStatusEl.textContent = 'Loading dictionary… fallback active';
  dictStatusEl.classList.add('pill');
  submitBtn.disabled = false; // enable with fallback immediately
  try {
    const res = await loadEnglishDictionary();
    dictionarySet = res.set;
    dictLoaded = !res.isFallback ? true : false;
    dictStatusEl.textContent = res.info;
    if (res.isFallback) {
      dictStatusEl.style.background = '#fee2e2';
      dictStatusEl.style.color = '#7f1d1d';
      log('Dictionary fetch failed. Using small built-in fallback list.');
    } else {
      dictStatusEl.style.background = '#dcfce7';
      dictStatusEl.style.color = '#14532d';
      log(res.info);
    }
  } catch {
    dictStatusEl.textContent = 'Offline mode: small fallback dictionary';
    dictStatusEl.style.background = '#fee2e2';
    dictStatusEl.style.color = '#7f1d1d';
    log('Dictionary fetch failed. Using small built-in fallback list.');
  }
}

function resetGame() {
  gameOver = false;
  player.hp = player.maxHearts * HALF;
  enemy.hp = enemy.maxHearts * HALF;
  renderHearts();
  selected = [];
  selectedSet.clear();
  initGrid();
  renderGrid();
  updateWordUI();
  message('');
  submitBtn.disabled = false;
  shuffleBtn.disabled = false;
  newGameBtn.style.display = 'none';
  logEl.innerHTML = '';
  log('New game started.');
}

// Events
submitBtn.addEventListener('click', submitWord);
clearBtn.addEventListener('click', clearSelection);
shuffleBtn.addEventListener('click', shuffleGrid);
newGameBtn.addEventListener('click', resetGame);

// Kick off
initGrid();
renderGrid();
renderHearts();
updateWordUI();
initDictionary();

// Accessibility keyboard helpers (optional)
gridEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const pos = e.target.getAttribute('data-pos');
    if (pos) {
      const [r, c] = pos.split(',').map(Number);
      onTileClick(r, c);
    }
  }
});