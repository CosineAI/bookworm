// Word Battle — Bookworm-like (Refactored to modules, ready for future mechanics)
import { GRID_SIZE, PLAYER_MAX_HEARTS, HALF, TILE_TYPES, LONG_WORD_SCALING } from './constants.js';
import { makeTile, badgeFor, effectDescription, setSpawnBias, resetSpawnBias } from './tiles.js';
import { loadEnglishDictionary } from './dictionary.js';
import { Combatant } from './combatants.js';
import { letterDamageHalves } from './letters.js';
import { ENEMIES, createEnemy } from './enemies.js';
import { createItemPool } from './items.js';

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
const enemyStatusEl = document.getElementById('enemyStatus');
const enemyNameEl = document.getElementById('enemyName');
const equipmentListEl = document.getElementById('equipmentList');

// Shop DOM
const shopOverlay = document.getElementById('shopOverlay');
const healBtn = document.getElementById('healBtn');
const item1NameEl = document.getElementById('item1Name');
const item1DescEl = document.getElementById('item1Desc');
const item2NameEl = document.getElementById('item2Name');
const item2DescEl = document.getElementById('item2Desc');
const equipItem1Btn = document.getElementById('equipItem1Btn');
const equipItem2Btn = document.getElementById('equipItem2Btn');
const continueBtn = document.getElementById('continueBtn');

// Ending DOM
const endingOverlay = document.getElementById('endingOverlay');
const endingEnemyNameEl = document.getElementById('endingEnemyName');
const endingLongestEl = document.getElementById('endingLongest');
const endingHighestEl = document.getElementById('endingHighest');
const endingEffectsEl = document.getElementById('endingEffects');
const endingRestartBtn = document.getElementById('endingRestartBtn');

// State
const player = new Combatant(PLAYER_MAX_HEARTS);
let currentEnemyIndex = 0;
let enemy = createEnemy(ENEMIES[currentEnemyIndex]);
let grid = [];
let selected = [];         // array of {r, c}
let selectedSet = new Set();
let gameOver = false;
let refillAnimSet = new Set(); // positions to animate falling when refilled

// Run statistics across battles (reset when starting a new run)
const runStats = {
  longestWord: '',
  longestLen: 0,
  highestAttackWord: '',
  highestAttackHalves: 0,
  mostEffectsWord: '',
  mostEffectsCount: 0,
};
function clearRunStats() {
  runStats.longestWord = '';
  runStats.longestLen = 0;
  runStats.highestAttackWord = '';
  runStats.highestAttackHalves = 0;
  runStats.mostEffectsWord = '';
  runStats.mostEffectsCount = 0;
}
function updateStats(word, attackHalves, effects) {
  if (!word) return;
  const len = word.length;
  if (len > runStats.longestLen) {
    runStats.longestLen = len;
    runStats.longestWord = word;
  }
  if (attackHalves > runStats.highestAttackHalves) {
    runStats.highestAttackHalves = attackHalves;
    runStats.highestAttackWord = word;
  }
  const effectCount = effects ? (effects instanceof Set ? effects.size : effects.length || 0) : 0;
  if (effectCount > runStats.mostEffectsCount) {
    runStats.mostEffectsCount = effectCount;
    runStats.mostEffectsWord = word;
  }
}
function showRunStats(title = 'Run stats') {
  log(`— ${title} —`);
  const hearts = (runStats.highestAttackHalves || 0) / 2;
  log(`• Longest word: ${runStats.longestWord ? runStats.longestWord.toUpperCase() : '(none)'} (${runStats.longestLen})`);
  log(`• Highest attack: ${runStats.highestAttackWord ? runStats.highestAttackWord.toUpperCase() : '(none)'} (${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 || hearts === 0.5 ? '' : 's'})`);
  log(`• Most effects: ${runStats.mostEffectsWord ? runStats.mostEffectsWord.toUpperCase() : '(none)'} (${runStats.mostEffectsCount})`);
}

// Equipment reset for new runs
function resetItemsAndEffects() {
  // Reset active effects
  activeEffects.holyVowel = false;
  activeEffects.fireproof = false;
  activeEffects.healingStaff = false;
  activeEffects.redEnhanced = false;
  activeEffects.grayGoggles = false;
  activeEffects.fireWarAxe = false;

  // Reset spawn biases from blessings
  resetSpawnBias();

  // Clear equipped items list and UI
  equippedItems = [];
  renderEquipment();

  // Reset max hearts to base and clamp current HP
  player.maxHearts = PLAYER_MAX_HEARTS;
  const maxHalves = player.maxHearts * HALF;
  if (player.hp > maxHalves) player.hp = maxHalves;
  renderHearts();
}

function openEnding() {
  // Populate stats into ending overlay
  if (endingEnemyNameEl) endingEnemyNameEl.textContent = enemy?.name || 'Enemy';
  if (endingLongestEl) {
    const w = runStats.longestWord ? runStats.longestWord.toUpperCase() : '(none)';
    const len = runStats.longestLen || 0;
    endingLongestEl.textContent = `${w}${len ? ` (${len} letters)` : ''}`;
  }
  if (endingHighestEl) {
    const w = runStats.highestAttackWord ? runStats.highestAttackWord.toUpperCase() : '(none)';
    const halves = runStats.highestAttackHalves || 0;
    endingHighestEl.textContent = `${w}${halves ? ` (${formatHearts(halves)})` : ''}`;
  }
  if (endingEffectsEl) {
    const w = runStats.mostEffectsWord ? runStats.mostEffectsWord.toUpperCase() : '(none)';
    const count = runStats.mostEffectsCount || 0;
    endingEffectsEl.textContent = `${w}${count ? ` (${count} effect${count===1?'':'s'})` : ''}`;
  }
  if (endingOverlay) {
    endingOverlay.classList.add('show');
    endingOverlay.setAttribute('aria-hidden', 'false');
  }
}

function closeEnding() {
  if (endingOverlay) {
    endingOverlay.classList.remove('show');
    endingOverlay.setAttribute('aria-hidden', 'true');
  }
}

// Enemy special cadence state
let enemySpecial = { every: null, countdown: null };
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; } // kept for potential future use
function initEnemySpecial() {
  if (enemy && enemy.special && enemy.special.every) {
    enemySpecial.every = Math.max(1, enemy.special.every | 0);
    enemySpecial.countdown = enemySpecial.every;
  } else {
    enemySpecial.every = null;
    enemySpecial.countdown = null;
  }
}

// Player upgrades/effects
const activeEffects = {
  holyVowel: false,
  fireproof: false,
  healingStaff: false,
  redEnhanced: false,
  grayGoggles: false,
  fireWarAxe: false,
};
let shopSelectionMade = false;

// Status effects
let nextEnemyAttackHalved = false;



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
      tile.innerHTML = `<span class=\"ch\">${cell.ch}</span>${badge ? `<span class=\"badge\">${badge}</span>` : ''}`;
      // Hover tooltip for special tiles
      if (cell.type && cell.type !== TILE_TYPES.NORMAL) {
        tile.title = effectDescription(cell.type);
      }
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
  // returns { attackHalves, healHalves, letters, effects }
  let attackHalvesFloat = 0;
  let healHalves = 0;
  const letters = selected.length;
  const vowels = new Set(['A','E','I','O','U']);
  let cursedCount = 0;
  const effects = new Set();
  let usedHolyVowel = false;
  let usedRed = false;
  let usedGray = false;
  let usedFireTile = false;
  let usedPoison = false;
  let usedCursed = false;

  for (const p of selected) {
    const cell = grid[p.r][p.c];
    if (!cell) continue;
    const base = letterDamageHalves(cell.ch);
    let contribution = base / 2; // halve letter damage
    const isVowel = vowels.has(String(cell.ch).toUpperCase());

    // Effect markers based on selection
    if (isVowel && activeEffects.holyVowel) usedHolyVowel = true;
    switch (cell.type) {
      case TILE_TYPES.RED: usedRed = true; break;
      case TILE_TYPES.GRAY: usedGray = true; break;
      case TILE_TYPES.FIRE: usedFireTile = true; break;
      case TILE_TYPES.POISON: usedPoison = true; break;
      case TILE_TYPES.CURSED: usedCursed = true; break;
      default: break;
    }

    switch (cell.type) {
      case TILE_TYPES.RED:
      case 'red': {
        let mult = 2; // red doubles the letter's damage
        if (activeEffects.redEnhanced) mult *= 2; // additional double -> x4 total
        if (activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.GREEN:
      case 'green': {
        let mult = 1;
        if (activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        healHalves += activeEffects.healingStaff ? 2 : 1; // heal ½ or full heart
        break;
      }
      case TILE_TYPES.GRAY:
      case 'gray': {
        if (activeEffects.grayGoggles) {
          let mult = 1;
          if (activeEffects.holyVowel && isVowel) mult *= 2;
          // Gray Goggles now make gray tiles deal half of normal damage
          attackHalvesFloat += contribution * mult * 0.5;
        } else {
          attackHalvesFloat += 0; // no damage
        }
        break;
      }
      case TILE_TYPES.FIRE: {
        let mult = 1;
        if (activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult; // behaves like normal for attack
        break;
      }
      case TILE_TYPES.POISON: {
        let mult = 1;
        if (activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult; // behaves like normal for attack
        break;
      }
      case TILE_TYPES.CURSED: {
        let mult = 1;
        if (activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult; // behaves like normal per-letter
        cursedCount += 1;
        break;
      }
      default: {
        let mult = 1;
        if (activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult; // normal
      }
    }
  }

  // Apply Cursed multiplier on the total if any cursed tiles are used
  if (cursedCount > 0) {
    if (cursedCount % 2 === 1) {
      attackHalvesFloat *= 0.5; // odd count halves total attack
      effects.add('cursed_odd');
    } else {
      attackHalvesFloat *= 1.5; // even count boosts total by x1.5
      effects.add('cursed_even');
    }
    effects.add('cursed');
  }

  // Firey War Axe: add ½ heart per fire tile on the field (in halves)
  if (activeEffects.fireWarAxe) {
    const fireTilesOnField = countFireTiles();
    if (fireTilesOnField > 0) effects.add('fire_war_axe');
    attackHalvesFloat += fireTilesOnField;
  }

  // Long word multiplying bonus: scale per letter beyond threshold
  if (LONG_WORD_SCALING && typeof LONG_WORD_SCALING.threshold === 'number') {
    const extra = Math.max(0, letters - LONG_WORD_SCALING.threshold);
    if (extra > 0) {
      const per = Number(LONG_WORD_SCALING.perExtraMultiplier || 0);
      const mult = 1 + per * extra;
      effects.add('long_word_scaling');
      attackHalvesFloat *= mult;
    }
  }

  // Post-process effect tags from markers
  if (usedRed) {
    effects.add('red');
    if (activeEffects.redEnhanced) effects.add('red_enhanced');
  }
  if (usedGray) {
    effects.add('gray');
    if (activeEffects.grayGoggles) effects.add('gray_goggles');
  }
  if (usedFireTile) effects.add('fire');
  if (usedPoison) effects.add('poison');
  if (usedHolyVowel) effects.add('holy_vowel');

  const attackHalves = Math.round(attackHalvesFloat); // nearest ½ heart
  return { attackHalves, healHalves, letters, effects: Array.from(effects) };
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
  log('Shuffled letters. Passing turn...');
  enemyAttack();
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

function updateEnemyNameUI() {
  if (!enemyNameEl) return;
  enemyNameEl.textContent = enemy?.name ? enemy.name : 'Enemy';
}

function formatHearts(halves) {
  const hearts = halves / 2;
  if (hearts === 0.5) return '½ heart';
  if (Number.isInteger(hearts)) return `${hearts} heart${hearts === 1 ? '' : 's'}`;
  return `${hearts} hearts`;
}

function updateEnemyStatusUI() {
  if (!enemyStatusEl) return;

  // Compute next-turn damage including special and poison
  let halves = enemy?.damageHalvesPerTurn || 0;
  const isSpecialNext = enemySpecial.every != null && enemySpecial.countdown <= 1;
  if (isSpecialNext && enemy.special?.damageMult) {
    halves *= enemy.special.damageMult;
  }
  if (nextEnemyAttackHalved) {
    halves = Math.floor(halves / 2);
  }

  // Compose action text for specials
  let actionText = '';
  if (isSpecialNext && Array.isArray(enemy.special?.actions)) {
    const parts = [];
    for (const a of enemy.special.actions) {
      const count = Math.max(1, a.count | 0);
      if (a.type === 'gray_tiles') parts.push(`turn ${count} tile${count>1?'s':''} gray`);
      if (a.type === 'fire_tiles') parts.push(`turn ${count} tile${count>1?'s':''} fire`);
    }
    if (parts.length > 0) {
      actionText = ' + ' + parts.join(' + ');
    }
  }

  const msg = `Will deal ${formatHearts(halves)} next turn${actionText}`;
  enemyStatusEl.textContent = msg;
  enemyStatusEl.classList.remove('charging');
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
}

// Deterministic special actions applied on scheduled turns
function applySpecialActions(actions) {
  if (!actions || actions.length === 0) return;
  let gr = 0, fr = 0;
  for (const a of actions) {
    const count = Math.max(1, a.count | 0);
    if (a.type === 'gray_tiles') gr += grayOutRandomTiles(count);
    if (a.type === 'fire_tiles') fr += igniteRandomTiles(count);
  }
  if (gr > 0) log(`Enemy special: ${gr} tile${gr>1?'s':''} turned gray.`);
  if (fr > 0) log(`Enemy special: ${fr} tile${fr>1?'s':''} set ablaze.`);
}

// Environmental hazards (fire tiles)
function countFireTiles() {
  let n = 0;
  for (let r=0; r<GRID_SIZE; r++) {
    for (let c=0; c<GRID_SIZE; c++) {
      if (grid[r][c].type === TILE_TYPES.FIRE) n++;
    }
  }
  return n;
}

function applyFireHazard() {
  const count = countFireTiles();
  if (count <= 0) return;
  let halves = count; // 1 half-heart per fire tile
  if (activeEffects.fireproof) {
    halves = Math.floor(halves / 2); // rounded down to nearest half-heart
  }
  if (halves <= 0) return;
  player.takeDamage(halves);
  renderHearts();
  const hearts = halves / 2;
  const label = hearts === 0.5 ? '−½' : `−${hearts}`;
  floatDamage(playerHeartsEl, label, 'player');
  log(`🔥 Fire burns you for ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 ? '' : hearts === 0.5 ? '' : 's'}.`);
  if (player.isDead()) gameLost();
}

// Game end
function gameWon() {
  gameOver = true;
  const isFinal = currentEnemyIndex === ENEMIES.length - 1;
  message(isFinal ? 'You win! Final enemy defeated.' : 'You win! Enemy defeated.', '');
  log('🏆 Victory! You defeated the enemy.');
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;

  if (isFinal) {
    // Show ending overlay with top stats
    openEnding();
  } else {
    // Open shop between battles
    openShop();
  }
}

function gameLost() {
  gameOver = true;
  message('You were defeated. Try again.', 'bad');
  log('💀 Defeat. The enemy outlasted you.');
  submitBtn.disabled = true;
  shuffleBtn.disabled = true;
  showRunStats('Run stats');
  newGameBtn.style.display = 'inline-block';
}

// Combat
function enemyAttack() {
  if (gameOver) return;

  const hasSpecial = enemySpecial.every != null;
  const isSpecial = hasSpecial && enemySpecial.countdown <= 1;

  let dmg = enemy.damageHalvesPerTurn; // in half-hearts
  if (isSpecial && enemy.special && enemy.special.damageMult) {
    dmg *= enemy.special.damageMult;
  }

  if (nextEnemyAttackHalved) {
    const original = dmg;
    dmg = Math.floor(dmg / 2);
    nextEnemyAttackHalved = false;
    log(`☠️ Enemy is poisoned: attack halved from ${original/2} to ${dmg/2} heart${dmg/2===1?'':'s'}.`);
  }

  player.takeDamage(dmg);
  renderHearts();
  const hearts = dmg / 2;
  const label = hearts === 0.5 ? '−½' : `−${hearts}`;
  floatDamage(playerHeartsEl, label, 'player');
  if (isSpecial && enemy.special && enemy.special.damageMult && enemy.special.damageMult !== 1) {
    log(`💢 Special strike! ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 || hearts === 0.5 ? '' : 's'} damage.`);
  } else {
    log(`Enemy strikes for ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 ? '' : hearts === 0.5 ? '' : 's'}.`);
  }
  if (player.isDead()) { gameLost(); return; }

  // Apply deterministic special actions (before hazards)
  if (isSpecial && enemy.special && Array.isArray(enemy.special.actions)) {
    applySpecialActions(enemy.special.actions);
  }

  // Debuffs after attack (random, if any configured)
  applyEnemyDebuffs();

  // Environmental: fire tiles deal damage
  applyFireHazard();

  // Special countdown progression
  if (hasSpecial) {
    if (isSpecial) {
      enemySpecial.countdown = enemySpecial.every;
    } else {
      enemySpecial.countdown -= 1;
    }
    updateEnemyStatusUI();
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
  const { attackHalves, healHalves, effects } = computeAttackInfo();

  // Update run stats for this attack
  updateStats(w, attackHalves, effects);

  // Poison: if any selected tile is poison, halve enemy's next attack
  const poisonUsed = used.some(({r, c}) => grid[r][c].type === TILE_TYPES.POISON);
  if (poisonUsed) {
    nextEnemyAttackHalved = true;
    log('☠️ You applied poison: the enemy’s next attack will be halved.');
    updateEnemyStatusUI();
  }

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

  // Clear transient status
  nextEnemyAttackHalved = false;

  // Advance to the next enemy for increasing difficulty (within the same run)
  currentEnemyIndex = (currentEnemyIndex + 1) % ENEMIES.length;
  enemy = createEnemy(ENEMIES[currentEnemyIndex]);

  initEnemySpecial();
  updateEnemyNameUI();
  updateEnemyStatusUI();

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
  log(`New game started. Enemy: ${enemy.name}.`);
}

function startNewRun() {
  // Begin a fresh run at the first enemy; reset items/effects
  gameOver = false;
  clearRunStats();
  resetItemsAndEffects();
  nextEnemyAttackHalved = false;

  currentEnemyIndex = 0;
  enemy = createEnemy(ENEMIES[currentEnemyIndex]);

  initEnemySpecial();
  updateEnemyNameUI();
  updateEnemyStatusUI();

  selected = [];
  selectedSet.clear();
  initGrid();
  renderGrid();
  renderHearts();
  updateWordUI();
  message('');
  submitBtn.disabled = false;
  shuffleBtn.disabled = false;
  newGameBtn.style.display = 'none';
  logEl.innerHTML = '';
  log(`New run started. Enemy: ${enemy.name}.`);
}



// Items are now provided by items.js

let shopItems = [];

function pickRandomItems(pool, n = 2) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function renderShopItems() {
  const [a, b] = shopItems;
  item1NameEl.textContent = a.name;
  item1DescEl.textContent = a.desc;
  item2NameEl.textContent = b.name;
  item2DescEl.textContent = b.desc;
}

function openShop() {
  shopSelectionMade = false;
  const pool = createItemPool({ activeEffects, setSpawnBias, player, renderHearts });
  shopItems = pickRandomItems(pool, 2);
  renderShopItems();

  healBtn.disabled = false;
  equipItem1Btn.disabled = false;
  equipItem2Btn.disabled = false;

  shopOverlay.classList.add('show');
  shopOverlay.setAttribute('aria-hidden', 'false');
}
function closeShop() {
  shopOverlay.classList.remove('show');
  shopOverlay.setAttribute('aria-hidden', 'true');
}

function selectHeal() {
  if (shopSelectionMade) return;
  const before = player.hp;
  player.heal(player.maxHearts * HALF); // heal to full
  const healedHearts = (player.hp - before) / 2;
  renderHearts();
  if (healedHearts > 0) {
    floatDamage(playerHeartsEl, `＋${healedHearts}${healedHearts % 1 ? '' : ''}`, 'heal');
    log(`Shop: Healed ${healedHearts} heart${healedHearts===1?'':'s'}.`);
  } else {
    log('Shop: You are already at full health.');
  }
  shopSelectionMade = true;
  healBtn.disabled = true;
  equipItem1Btn.disabled = true;
  equipItem2Btn.disabled = true;

  // Proceed immediately to next battle
  closeShop();
  resetGame();
}

function equipItem(index) {
  if (shopSelectionMade) return;
  shopSelectionMade = true;

  let item = shopItems[index];
  try {
    if (item && typeof item.apply === 'function') {
      item.apply();
      // Track equipment list (avoid duplicates by key)
      if (!equippedItems.find(it => it.key === item.key)) {
        equippedItems.push({ key: item.key, name: item.name });
      }
      renderEquipment();
      log(`Shop: Equipped ${item.name}.`);
    } else {
      log('Shop: No item available to equip. Proceeding to next battle.');
    }
  } catch (e) {
    // Ensure we still proceed even if item application fails
    console.error('Equip error:', e);
    log('Shop: Failed to equip item due to an error. Proceeding to next battle.');
  }

  // Disable all shop actions to prevent double-activation
  healBtn.disabled = true;
  equipItem1Btn.disabled = true;
  equipItem2Btn.disabled = true;

  // Proceed immediately to next battle
  closeShop();
  resetGame();
}

// Events
submitBtn.addEventListener('click', submitWord);
clearBtn.addEventListener('click', clearSelection);
shuffleBtn.addEventListener('click', shuffleGrid);
newGameBtn.addEventListener('click', () => { startNewRun(); });

// Shop events
healBtn.addEventListener('click', selectHeal);
equipItem1Btn.addEventListener('click', () => equipItem(0));
equipItem2Btn.addEventListener('click', () => equipItem(1));
continueBtn.addEventListener('click', () => {
  log('Shop: Skipped shop.');
  closeShop();
  resetGame();
});

endingRestartBtn.addEventListener('click', () => {
  closeEnding();
  startNewRun();
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