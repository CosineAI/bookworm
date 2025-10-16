// Word Battle — Bookworm-like (Refactored to modules, ready for future mechanics)
import { GRID_SIZE, PLAYER_MAX_HEARTS, HALF, TILE_TYPES } from './constants.js';
import { makeTile, badgeFor } from './tiles.js';
import { loadEnglishDictionary } from './dictionary.js';
import { Combatant } from './combatants.js';
import { letterDamageHalves } from './letters.js';
import { ENEMIES, createEnemy } from './enemies.js';

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

// Shop DOM
const shopOverlay = document.getElementById('shopOverlay');
const buyPotionBtn = document.getElementById('buyPotionBtn');
const buyHolyVowelBtn = document.getElementById('buyHolyVowelBtn');
const continueBtn = document.getElementById('continueBtn');

// State
const player = new Combatant(PLAYER_MAX_HEARTS);
let currentEnemyIndex = 0;
let enemy = createEnemy(ENEMIES[currentEnemyIndex]);
let grid = [];
let selected = [];         // array of {r, c}
let selectedSet = new Set();
let gameOver = false;
let refillAnimSet = new Set(); // positions to animate falling when refilled

// Player upgrades
let holyVowelActive = false;

// Dictionary - start with a tiny built-in set so you can play immediately
const BUILTIN_SMALL_SET = new Set([
  'a','an','and','are','as','at','be','by','can','do','for','go','had','has','have','he','her','him','his','i',
  'in','is','it','like','man','me','my','no','not','of','on','one','or','our','out','said','see','she','so',
  'the','their','them','then','there','they','this','to','two','up','use','was','we','well','were','what',
  'when','which','who','will','with','word','work','would','year','you','your','red','blue','green','day',
  'boy','girl','dog','cat','run','walk','play','read','write','big','small','good','bad'
]);
let dictionarySet = BUILTIN_SMALL_SET;

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
  let attackHalvesFloat = 0;
  let healHalves = 0;
  const letters = selected.length;
  const vowels = new Set(['A','E','I','O','U']);

  for (const p of selected) {
    const cell = grid[p.r][p.c];
    if (!cell) continue;
    const base = letterDamageHalves(cell.ch);
    let contribution = base / 2; // halve letter damage
    const isVowel = vowels.has(String(cell.ch).toUpperCase());

    switch (cell.type) {
      case TILE_TYPES.RED:
      case 'red': {
        // Red doubles damage; Holy Vowel doubles vowels as well.
        let mult = 2;
        if (holyVowelActive && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.GREEN:
      case 'green': {
        let mult = 1;
        if (holyVowelActive && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        healHalves += 1;             // plus heal (constant ½ heart)
        break;
      }
      case TILE_TYPES.GRAY:
      case 'gray':
        attackHalvesFloat += 0; // no damage
        break;
      case TILE_TYPES.FIRE:
        // Fire behaves like normal for attack contribution; hazard handled separately.
        {
          let mult = 1;
          if (holyVowelActive && isVowel) mult *= 2;
          attackHalvesFloat += contribution * mult;
        }
        break;
      default: {
        let mult = 1;
        if (holyVowelActive && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult; // normal
      }
    }
  }
  const attackHalves = Math.round(attackHalvesFloat); // nearest ½ heart
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

// Enemy debuffs
function grayOutRandomTiles(count) {
  const pool = [];
  for (let r=0; r<GRID_SIZE; r++) {
    for (let c=0; c<GRID_SIZE; c++) {
      if (grid[r][c].type !== TILE_TYPES.GRAY) pool.push({ r, c });
    }
  }
  if (pool.length === 0 || count <= 0) return 0;
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.min(count, pool.length);
  for (let i=0; i<n; i++) {
    const { r, c } = pool[i];
    grid[r][c].type = TILE_TYPES.GRAY;
  }
  renderGrid();
  return n;
}

function igniteRandomTiles(count) {
  const pool = [];
  for (let r=0; r<GRID_SIZE; r++) {
    for (let c=0; c<GRID_SIZE; c++) {
      if (grid[r][c].type !== TILE_TYPES.FIRE) pool.push({ r, c });
    }
  }
  if (pool.length === 0 || count <= 0) return 0;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.min(count, pool.length);
  for (let i=0; i<n; i++) {
    const { r, c } = pool[i];
    grid[r][c].type = TILE_TYPES.FIRE;
  }
  renderGrid();
  return n;
}

function applyEnemyDebuffs() {
  const debuffs = enemy.debuffs || [];
  for (const d of debuffs) {
    const chance = Math.max(0, Math.min(1, d.chance || 0));
    if (Math.random() <= chance) {
      switch (d.type) {
        case 'gray_tiles': {
          const turned = grayOutRandomTiles(d.count || 1);
          if (turned > 0) log(`Enemy hex: ${turned} tile${turned>1?'s':''} turned gray.`);
          break;
        }
        case 'fire_tiles': {
          const ignited = igniteRandomTiles(d.count || 1);
          if (ignited > 0) log(`Enemy hex: ${ignited} tile${ignited>1?'s':''} set ablaze.`);
          break;
        }
        default:
          break;
      }
    }
  }
} = pool[i];
    grid[r][c].type = TILE_TYPES.FIRE;
  }
  renderGrid();
  return n;
}

function applyEnemyDebuffs() {
  const debuffs = enemy.debuffs || [];
  for (const d of debuffs) {
    const chance = Math.max(0, Math.min(1, d.chance || 0));
    if (Math.random() <= chance) {
      switch (d.type) {
        case 'gray_tiles': {
          const turned = grayOutRandomTiles(d.count || 1);
          if (turned > 0) log(`Enemy hex: ${turned} tile${turned>1?'s':''} turned gray.`);
          break;
        }
        case 'ignite_tiles': {
          const turned = igniteRandomTiles(d.count || 1);
          if (turned > 0) log(`Enemy hex: ${turned} tile${turned>1?'s':''} ignited.`);
          break;
        }
        default:
          break;
      }
    }
  }
}

// Fire hazard damage: each FIRE tile deals ½ heart per turn
function countFireTiles() {
  let n = 0;
  for (let r=0; r<GRID_SIZE; r++) {
    for (let c=0; c<GRID_SIZE; c++) {
      if (grid[r][c].type === TILE_TYPES.FIRE) n++;
    }
  }
  return n;
}

// Game end
function gameWon() {
  gameOver = true;
  message('You win! Enemy defeated.', '');
  log('🏆 Victory! You defeated the enemy.');
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;

  // Open shop between battles
  openShop();
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
  if (player.isDead()) { gameLost(); return; }

  // Debuffs after attack
  applyEnemyDebuffs();

  // Environmental: fire tiles deal damage
  applyFireHazard();
}

  // Debuffs after attack
  applyEnemyDebuffs();

  // Fire hazard damage after debuffs (tiles that remain/appear this turn)
  const fires = countFireTiles();
  if (fires > 0) {
    const hazardHalves = fires * 1; // ½ heart per fire tile
    player.takeDamage(hazardHalves);
    renderHearts();
    const hazardHearts = hazardHalves / 2;
    floatDamage(playerHeartsEl, hazardHearts === 0.5 ? '−½' : `−${hazardHearts}`, 'player');
    log(`🔥 Fire burns you for ${hazardHearts === 0.5 ? '½' : hazardHearts} heart${hazardHearts === 1 ? '' : hazardHearts === 0.5 ? '' : 's'} (${fires} fire tile${fires>1?'s':''}).`);
    if (player.isDead()) { gameLost(); return; }
  }
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
  // Always check against the currently active dictionary (remote, local, or built-in)
  return dictionarySet ? dictionarySet.has(w) : false;
}

// Dictionary loading (non-blocking: play allowed via fallback while it loads)
async function initDictionary() {
  dictStatusEl.textContent = 'Loading dictionary… fallback active';
  dictStatusEl.classList.add('pill');
  submitBtn.disabled = false; // enable with built-in fallback immediately

  try {
    const res = await loadEnglishDictionary();
    dictionarySet = res.set;
    dictStatusEl.textContent = res.info;
    if (res.isFallback) {
      dictStatusEl.style.background = '#fee2e2';
      dictStatusEl.style.color = '#7f1d1d';
      log(res.info);
    } else {
      dictStatusEl.style.background = '#dcfce7';
      dictStatusEl.style.color = '#14532d';
      log(res.info);
    }
  } catch {
    // Keep using built-in set
    dictStatusEl.textContent = 'Offline mode: small built-in dictionary';
    dictStatusEl.style.background = '#fee2e2';
    dictStatusEl.style.color = '#7f1d1d';
    log('Dictionary fetch failed. Using built-in fallback list.');
  }
}

function resetGame() {
  gameOver = false;
  player.hp = player.maxHearts * HALF;

  // Advance to the next enemy for increasing difficulty
  currentEnemyIndex = (currentEnemyIndex + 1) % ENEMIES.length;
  enemy = createEnemy(ENEMIES[currentEnemyIndex]);

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
  log(`New game started. Enemy: ${enemy.name}.`);
}

// Shop
function openShop() {
  shopOverlay.classList.add('show');
  shopOverlay.setAttribute('aria-hidden', 'false');
  // Enable/disable buttons based on state
  buyHolyVowelBtn.disabled = holyVowelActive; // already active
  buyPotionBtn.disabled = false; // can always use a potion between battles
}
function closeShop() {
  shopOverlay.classList.remove('show');
  shopOverlay.setAttribute('aria-hidden', 'true');
}

function usePotion() {
  const before = player.hp;
  player.heal(player.maxHearts * HALF); // heal to full
  const healedHearts = (player.hp - before) / 2;
  renderHearts();
  if (healedHearts > 0) {
    floatDamage(playerHeartsEl, `＋${healedHearts}${healedHearts % 1 ? '' : ''}`, 'heal');
    log(`Shop: Insta-potion used. Healed ${healedHearts} heart${healedHearts===1?'':'s'}.`);
  } else {
    log('Shop: You are already at full health.');
  }
  buyPotionBtn.disabled = true;
}

function activateHolyVowel() {
  if (holyVowelActive) return;
  holyVowelActive = true;
  buyHolyVowelBtn.disabled = true;
  log('Shop: Holy Vowel activated. Vowels deal double attack.');
}

// Events
submitBtn.addEventListener('click', submitWord);
clearBtn.addEventListener('click', clearSelection);
shuffleBtn.addEventListener('click', shuffleGrid);
newGameBtn.addEventListener('click', resetGame);

// Shop events
buyPotionBtn.addEventListener('click', usePotion);
buyHolyVowelBtn.addEventListener('click', activateHolyVowel);
continueBtn.addEventListener('click', () => {
  closeShop();
  resetGame();
});

// Kick off
initGrid();
renderGrid();
renderHearts();
updateWordUI();
initDictionary();
log(`Enemy: ${enemy.name}.`);

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