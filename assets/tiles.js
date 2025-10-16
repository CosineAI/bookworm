// Tile helpers kept separate for future mechanics (e.g., multipliers, statuses)
import { TILE_TYPES, TILE_TYPE_PROBABILITIES } from './constants.js';
import { randomLetter } from './letters.js';

export function randomType() {
  const r = Math.random();
  const pRed = TILE_TYPE_PROBABILITIES.red || 0;
  const pGreen = TILE_TYPE_PROBABILITIES.green || 0;
  const pGray = TILE_TYPE_PROBABILITIES.gray || 0;
  const pFire = TILE_TYPE_PROBABILITIES.fire || 0;

  if (r < pRed) return TILE_TYPES.RED;
  if (r < pRed + pGreen) return TILE_TYPES.GREEN;
  if (r < pRed + pGreen + pGray) return TILE_TYPES.GRAY;
  if (r < pRed + pGreen + pGray + pFire) return TILE_TYPES.FIRE;
  return TILE_TYPES.NORMAL;
}

export function makeTile(ch = randomLetter(), type = randomType()) {
  return { ch, type };
}

export function badgeFor(type) {
  if (type === TILE_TYPES.RED) return '💥';
  if (type === TILE_TYPES.GREEN) return '➕';
  if (type === TILE_TYPES.GRAY) return 'Ø';
  if (type === TILE_TYPES.FIRE) return '🔥';
  return '';
}

export function badgeFor(type) {
  if (type === TILE_TYPES.RED) return '💥';
  if (type === TILE_TYPES.GREEN) return '➕';
  if (type === TILE_TYPES.GRAY) return 'Ø';
  if (type === TILE_TYPES.FIRE) return '🔥';
  return '';
}