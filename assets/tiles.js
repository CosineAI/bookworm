// Tile helpers kept separate for future mechanics (e.g., multipliers, statuses)
import { TILE_TYPES, TILE_TYPE_PROBABILITIES } from './constants.js';
import { randomLetter } from './letters.js';

export function randomType() {
  const r = Math.random();
  const pRed = TILE_TYPE_PROBABILITIES.red || 0;
  const pGreen = TILE_TYPE_PROBABILITIES.green || 0;
  const pGray = TILE_TYPE_PROBABILITIES.gray || 0;
  const pFire = TILE_TYPE_PROBABILITIES.fire || 0;
  const pPoison = TILE_TYPE_PROBABILITIES.poison || 0;
  const pCursed = TILE_TYPE_PROBABILITIES.cursed || 0;

  if (r < pRed) return TILE_TYPES.RED;
  if (r < pRed + pGreen) return TILE_TYPES.GREEN;
  if (r < pRed + pGreen + pGray) return TILE_TYPES.GRAY;
  if (r < pRed + pGreen + pGray + pFire) return TILE_TYPES.FIRE;
  if (r < pRed + pGreen + pGray + pFire + pPoison) return TILE_TYPES.POISON;
  if (r < pRed + pGreen + pGray + pFire + pPoison + pCursed) return TILE_TYPES.CURSED;
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
  if (type === TILE_TYPES.POISON) return '☠️';
  if (type === TILE_TYPES.CURSED) return '⚠️';
  return '';
}

export function effectDescription(type) {
  switch (type) {
    case TILE_TYPES.RED:
      return 'Red: This letter deals double damage when used.';
    case TILE_TYPES.GREEN:
      return 'Green: Heals you by ½ heart when used.';
    case TILE_TYPES.GRAY:
      return 'Gray: Contributes no damage when used.';
    case TILE_TYPES.FIRE:
      return 'Fire: Burns you for ½ heart at the end of each enemy turn until removed.';
    case TILE_TYPES.POISON:
      return 'Poison: Halves the enemy’s next attack when used.';
    case TILE_TYPES.CURSED:
      return 'Cursed: Odd count halves total attack; even count increases attack by 1.5×.';
    default:
      return 'Normal tile.';
  }
}