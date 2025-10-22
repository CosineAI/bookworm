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

function getCurrentWordFromSelection() {
  return state.selected.map((p) => {
    const cell = state.grid[p.r][p.c];
    return cell && cell.ch ? String(cell.ch) : '';
  }).join('');
}

function isPalindromeStr(s) {
  if (!s) return false;
  const up = s.toUpperCase();
  const len = up.length;
  for (let i = 0; i < Math.floor(len / 2); i++) {
    if (up[i] !== up[len - 1 - i]) return false;
  }
  return true;
}

function hasDoubleAdjacent(s) {
  if (!s) return false;
  const up = s.toUpperCase();
  for (let i = 1; i < up.length; i++) {
    if (up[i] === up[i - 1]) return true;
  }
  return false;
}

export function computeAttackInfo() {
  let attackHalvesFloat = 0;
  let healHalves = 0;
  const letters = state.selected.length;
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  const heavyLetters = new Set(['J', 'Q', 'Z', 'X']);
  const currentWord = getCurrentWordFromSelection();

  let cursedCount = 0;
  const effects = new Set();
  let usedHolyVowel = false;
  let usedRed = false;
  let usedGray = false;
  let usedFireTile = false;
  let usedPoison = false;
  let usedCursed = false;
  let usedFrozen = false;
  let usedGreenCount = 0;

  for (const p of state.selected) {
    const cell = state.grid[p.r][p.c];
    if (!cell) continue;
    const base = letterDamageHalves(cell.ch);
    let contribution = base / 2;
    const chUp = String(cell.ch).toUpperCase();
    const isVowel = vowels.has(chUp);
    const isHeavy = heavyLetters.has(chUp);

    if (isVowel && state.activeEffects.holyVowel) usedHolyVowel = true;
    switch (cell.type) {
      case TILE_TYPES.RED: usedRed = true; break;
      case TILE_TYPES.GRAY: usedGray = true; break;
      case TILE_TYPES.FIRE: usedFireTile = true; break;
      case TILE_TYPES.POISON: usedPoison = true; break;
      case TILE_TYPES.CURSED: usedCursed = true; break;
      case TILE_TYPES.FROZEN: usedFrozen = true; break;
      case TILE_TYPES.GREEN: usedGreenCount += 1; break;
      default: break;
    }

    switch (cell.type) {
      case TILE_TYPES.RED:
      case 'red': {
        let mult = 2;
        if (state.activeEffects.redEnhanced) mult *= 2;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.GREEN:
      case 'green': {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
        healHalves += state.activeEffects.healingStaff ? 2 : 1;
        break;
      }
      case TILE_TYPES.GRAY:
      case 'gray': {
        if (state.activeEffects.grayGoggles) {
          let mult = 1;
          if (state.activeEffects.holyVowel && isVowel) mult *= 2;
          if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
          attackHalvesFloat += contribution * mult * 0.5;
        } else {
          attackHalvesFloat += 0;
        }
        break;
      }
      case TILE_TYPES.FIRE: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.POISON: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
        break;
      }
      case TILE_TYPES.CURSED: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
        cursedCount += 1;
        break;
      }
      case TILE_TYPES.FROZEN: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
        break;
      }
      default: {
        let mult = 1;
        if (state.activeEffects.holyVowel && isVowel) mult *= 2;
        if (state.activeEffects.jqzxExpert && isHeavy) mult *= 3;
        attackHalvesFloat += contribution * mult;
      }
    }
  }

  // Cursed parity
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

  // Fire War Axe: +½ per fire tile on field
  if (state.activeEffects.fireWarAxe) {
    const fireTilesOnField = countFireTiles();
    if (fireTilesOnField > 0) effects.add('fire_war_axe');
    attackHalvesFloat += fireTilesOnField;
  }

  // Long word scaling
  if (LONG_WORD_SCALING && typeof LONG_WORD_SCALING.threshold === 'number') {
    const extra = Math.max(0, letters - LONG_WORD_SCALING.threshold);
    if (extra > 0) {
      const per = Number(LONG_WORD_SCALING.perExtraMultiplier || 0);
      const mult = 1 + per * extra;
      effects.add('long_word_scaling');
      attackHalvesFloat *= mult;
    }
  }

  // Scrabbler: doubles attack for words 7+ letters
  if (state.activeEffects.scrabbler && letters >= 7) {
    attackHalvesFloat *= 2;
    effects.add('scrabbler');
  }

  // Doubling Doubloon: +½ if any adjacent duplicate letters in the word
  if (state.activeEffects.doublingDoubloon && hasDoubleAdjacent(currentWord)) {
    attackHalvesFloat += 1;
    effects.add('doubling_doubloon');
  }

  // Palindromer: ×1.5 attack if the word is a palindrome
  if (state.activeEffects.palindromer && isPalindromeStr(currentWord)) {
    attackHalvesFloat *= 1.5;
    effects.add('palindromer');
  }

  // Mirror Edge: +½ if first and last letters match
  if (state.activeEffects.mirrorEdge && currentWord && currentWord.length > 0) {
    const up = currentWord.toUpperCase();
    if (up[0] === up[up.length - 1]) {
      attackHalvesFloat += 1;
      effects.add('mirror_edge');
    }
  }

  // Vowel Suite: ×1.5 if word has 4+ distinct vowels
  if (state.activeEffects.vowelSuite && currentWord && currentWord.length > 0) {
    const up = currentWord.toUpperCase();
    const vset = new Set();
    for (let i = 0; i < up.length; i++) {
      const ch = up[i];
      if (ch === 'A' || ch === 'E' || ch === 'I' || ch === 'O' || ch === 'U') vset.add(ch);
    }
    if (vset.size >= 4) {
      attackHalvesFloat *= 1.5;
      effects.add('vowel_suite');
    }
  }

  // Suffix Specialist: ×1.25 if the word ends with ING, ED, or ER
  if (state.activeEffects.suffixSpecialist && currentWord && currentWord.length > 0) {
    const up = currentWord.toUpperCase();
    if (up.endsWith('ING') || up.endsWith('ED') || up.endsWith('ER')) {
      attackHalvesFloat *= 1.25;
      effects.add('suffix_specialist');
    }
  }

  // Grayscale Gambit: +½ if any gray tile is used (non-stackable)
  if (usedGray && state.activeEffects.grayGambit) {
    attackHalvesFloat += 1;
    effects.add('gray_gambit');
  }

  // Crimson Echo: +½ per consecutive previous turn using red (applies before frozen halving)
  if (state.activeEffects.crimsonEcho && state.redEchoChain > 0) {
    attackHalvesFloat += state.redEchoChain;
    effects.add('crimson_echo');
  }

  // Frozen penalty: halves attack unless Ice Pick is equipped
  if (usedFrozen) {
    if (!state.activeEffects.ignoreFrozenPenalty) {
      attackHalvesFloat *= 0.5;
    }
    effects.add('frozen');
  }

  // Herbal Surge: +1 heart heal if 2+ green tiles used this word
  if (state.activeEffects.herbalSurge && usedGreenCount >= 2) {
    healHalves += 2;
    effects.add('herbal_surge');
  }

  // Effect flags
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