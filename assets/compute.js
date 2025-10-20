// Compute attack info from current selection
import { LONG_WORD_SCALING, TILE_TYPES } from './constants.js';
import { letterDamageHalves } from './letters.js';
import { state } from './state.js';

function countFireTiles() {
  let n = 0;
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      if (state.grid[r][c].type === TILE_TYPES.FIRE) n++;
    }
  }
  return n;
}

export function computeAttackInfo() {
  let attackHalvesFloat = 0;
  let healHalves = 0;
  const letters = state.selected.length;
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  let cursedCount = 0;
  const effects = new Set();
  let usedHolyVowel = false;
  let usedRed = false;
  let usedGray = false;
  let usedFireTile = false;
  let usedPoison = false;
  let usedCursed = false;
  let usedFrozen = false;

  for (const p of state.selected) {
    const cell = state.grid[p.r][p.c];
    if (!cell) continue;
    const base = letterDamageHalves(cell.ch);
    let contribution = base / 2;
    const isVowel = vowels.has(String(cell.ch).toUpperCase());

    if (isVowel && state.activeEffects.holyVowel) usedHolyVowel = true;
    switch (cell.type) {
      case TILE_TYPES.RED: usedRed = true; break;
      case TILE_TYPES.GRAY: usedGray = true; break;
      case TILE_TYPES.FIRE: usedFireTile = true; break;
      case TILE_TYPES.POISON: usedPoison = true; break;
      case TILE_TYPES.CURSED: usedCursed = true; break;
      case TILE_TYPES.FROZEN: usedFrozen = true; break;
      default: break;
    }

    switch (cell.type) {
      case TILE_TYPES.RED:
      case 'red': {
        let mult = 2;
        if (state.activeEffects.redEnhanced) mult *= 2;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.GREEN:
      case 'green': {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        healHalves += state.activeEffects.healingStaff ? 2 : 1;
        break;
      }
      case TILE_TYPES.GRAY:
      case 'gray': {
        if (state.activeEffects.grayGoggles) {
          let mult = 1;
          if (state.activeEffects.holyVowel && isVowel) mult *= 2;
          attackHalvesFloat += contribution * mult * 0.5;
        } else {
          attackHalvesFloat += 0;
        }
        break;
      }
      case TILE_TYPES.FIRE: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.POISON: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.CURSED: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        cursedCount += 1;
        break;
      }
      case TILE_TYPES.FROZEN: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
        break;
      }
      default: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        attackHalvesFloat += contribution * mult;
      }
    }
  }

  if (cursedCount > 0) {
    if (cursedCount % 2 === 1) {
      attackHalvesFloat *= 0.5;
      effects.add('cursed_odd');
    } else {
      attackHalvesFloat *= 1.5;
      effects.add('cursed_even');
    }
    effects.add('cursed');
  }

  if (state.activeEffects.fireWarAxe) {
    const fireTilesOnField = countFireTiles();
    if (fireTilesOnField > 0) effects.add('fire_war_axe');
    attackHalvesFloat += fireTilesOnField;
  }

  if (LONG_WORD_SCALING && typeof LONG_WORD_SCALING.threshold === 'number') {
    const extra = Math.max(0, letters - LONG_WORD_SCALING.threshold);
    if (extra > 0) {
      const per = Number(LONG_WORD_SCALING.perExtraMultiplier || 0);
      const mult = 1 + per * extra;
      effects.add('long_word_scaling');
      attackHalvesFloat *= mult;
    }
  }

  if (usedFrozen) {
    attackHalvesFloat *= 0.5;
    effects.add('frozen');
  }

  if (usedRed) {
    effects.add('red');
    if (state.activeEffects.redEnhanced) effects.add('red_enhanced');
  }
  if (usedGray) {
    effects.add('gray');
    if (state.activeEffects.grayGoggles) effects.add('gray_goggles');
  }
  if (usedFireTile) effects.add('fire');
  if (usedPoison) effects.add('poison');
  if (usedHolyVowel) effects.add('holy_vowel');

  const attackHalves = Math.round(attackHalvesFloat);
  return { attackHalves, healHalves, letters, effects: Array.from(effects) };
}