// Combat, effects, hazards
import { TILE_TYPES } from './constants.js';
import { state } from './state.js';
import { renderGrid } from './grid.js';
import { renderHearts, floatDamage, log, updateEnemyStatusUI } from './ui.js';
import { playerHeartsEl, enemyHeartsEl } from './dom.js';

// Enemy debuffs
export function grayOutRandomTiles(count) {
  const pool = [];
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const t = state.grid[r][c];
      if (t && !t.empty && t.type !== TILE_TYPES.GRAY) pool.push({ r, c });
    }
  }
  if (pool.length === 0 || count <= 0) return 0;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const { r, c } = pool[i];
    state.grid[r][c].type = TILE_TYPES.GRAY;
  }
  renderGrid();
  return n;
}

export function igniteRandomTiles(count) {
  const pool = [];
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const t = state.grid[r][c];
      if (t && !t.empty && t.type !== TILE_TYPES.FIRE) pool.push({ r, c });
    }
  }
  if (pool.length === 0 || count <= 0) return 0;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const { r, c } = pool[i];
    state.grid[r][c].type = TILE_TYPES.FIRE;
  }
  renderGrid();
  return n;
}

export function applyEnemyDebuffs() {
  const debuffs = state.enemy.debuffs || [];
  for (const d of debuffs) {
    const chance = Math.max(0, Math.min(1, d.chance || 0));
    if (Math.random() <= chance) {
      switch (d.type) {
        case 'gray_tiles': {
          const turned = grayOutRandomTiles(d.count || 1);
          if (turned > 0) log(`Enemy hex: ${turned} tile${turned > 1 ? 's' : ''} turned gray.`);
          break;
        }
        case 'fire_tiles': {
          const ignited = igniteRandomTiles(d.count || 1);
          if (ignited > 0) log(`Enemy hex: ${ignited} tile${ignited > 1 ? 's' : ''} set ablaze.`);
          break;
        }
        default:
          break;
      }
    }
  }
}

export function applySpecialActions(actions) {
  if (!actions || actions.length === 0) return;
  let gr = 0, fr = 0;
  for (const a of actions) {
    const count = Math.max(1, a.count | 0);
    if (a.type === 'gray_tiles') gr += grayOutRandomTiles(count);
    if (a.type === 'fire_tiles') fr += igniteRandomTiles(count);
  }
  if (gr > 0) log(`Enemy special: ${gr} tile${gr > 1 ? 's' : ''} turned gray.`);
  if (fr > 0) log(`Enemy special: ${fr} tile${fr > 1 ? 's' : ''} set ablaze.`);
}

// Environmental hazards
export function countFireTiles() {
  let n = 0;
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const t = state.grid[r][c];
      if (t && !t.empty && t.type === TILE_TYPES.FIRE) n++;
    }
  }
  return n;
}

export function countFrozenTiles() {
  let n = 0;
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const t = state.grid[r][c];
      if (t && !t.empty && t.type === TILE_TYPES.FROZEN) n++;
    }
  }
  return n;
}

export function applyFireHazard() {
  const count = countFireTiles();
  if (count <= 0) return;
  let halves = count;
  if (state.activeEffects.fireproof) {
    halves = Math.floor(halves / 2);
  }
  if (halves <= 0) return;
  state.player.takeDamage(halves);
  renderHearts();
  const hearts = halves / 2;
  const label = hearts === 0.5 ? '−½' : `−${hearts}`;
  floatDamage(playerHeartsEl, label, 'player');
  log(`🔥 Fire burns you for ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 ? '' : hearts === 0.5 ? '' : 's'}.`);
}

export function enemyAttack() {
  if (state.gameOver) return false;

  const hasSpecial = state.enemySpecial.every != null;
  const isSpecial = hasSpecial && state.enemySpecial.countdown <= 1;

  let dmg = state.enemy.damageHalvesPerTurn;
  if (isSpecial && state.enemy.special && state.enemy.special.damageMult) {
    dmg *= state.enemy.special.damageMult;
  }

  if (state.nextEnemyAttackHalved) {
    const original = dmg;
    dmg = Math.floor(dmg / 2);
    state.nextEnemyAttackHalved = false;
    log(`☠️ Enemy is poisoned: attack halved from ${original / 2} to ${dmg / 2} heart${dmg / 2 === 1 ? '' : 's'}.`);
  }

  if (state.activeEffects.frozenArmor) {
    const frozenOnField = countFrozenTiles();
    if (frozenOnField > 0) {
      const before = dmg;
      dmg = Math.max(0, dmg - frozenOnField);
      const reducedHearts = (before - dmg) / 2;
      if (reducedHearts > 0) {
        log(`🛡️ Frozen Armor reduces incoming damage by ${reducedHearts === 0.5 ? '½' : reducedHearts} heart${reducedHearts === 1 || reducedHearts === 0.5 ? '' : 's'}.`);
      }
    }
  }

  state.player.takeDamage(dmg);
  renderHearts();
  const hearts = dmg / 2;
  const label = hearts === 0.5 ? '−½' : `−${hearts}`;
  floatDamage(playerHeartsEl, label, 'player');
  if (isSpecial && state.enemy.special && state.enemy.special.damageMult && state.enemy.special.damageMult !== 1) {
    log(`💢 Special strike! ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 || hearts === 0.5 ? '' : 's'} damage.`);
  } else {
    log(`Enemy strikes for ${hearts === 0.5 ? '½' : hearts} heart${hearts === 1 ? '' : hearts === 0.5 ? '' : 's'}.`);
  }

  const playerDead = state.player.isDead();

  if (isSpecial && state.enemy.special && Array.isArray(state.enemy.special.actions)) {
    applySpecialActions(state.enemy.special.actions);
  }

  applyEnemyDebuffs();
  applyFireHazard();

  if (hasSpecial) {
    if (isSpecial) {
      state.enemySpecial.countdown = state.enemySpecial.every;
    } else {
      state.enemySpecial.countdown -= 1;
    }
    updateEnemyStatusUI();
  }

  return playerDead;
}

export function playerAttack(word, attackHalves, healHalves) {
  const enemyBefore = state.enemy.hp;
  state.enemy.takeDamage(attackHalves);
  const heartsDealt = (enemyBefore - state.enemy.hp) / 2;
  renderHearts();
  floatDamage(enemyHeartsEl, `−${heartsDealt}${heartsDealt % 1 ? '' : ''}`, 'enemy');

  if (healHalves > 0) {
    const prev = state.player.hp;
    state.player.heal(healHalves);
    const healedHearts = (state.player.hp - prev) / 2;
    if (healedHearts > 0) {
      renderHearts();
      floatDamage(playerHeartsEl, `＋${healedHearts}${healedHearts % 1 ? '' : ''}`, 'heal');
    }
  }

  log(`You played “${word.toUpperCase()}” for attack ${attackHalves}. Enemy took ${heartsDealt} heart${heartsDealt === 1 ? '' : 's'}.`);

  return state.enemy.isDead();
}