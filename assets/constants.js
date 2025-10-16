// Constants and config for the game (kept small and focused for easy extension)

export const GRID_SIZE = 4;

export const PLAYER_MAX_HEARTS = 6;
export const ENEMY_MAX_HEARTS = 6;
export const HALF = 2;

// Enemy deals 1 half-heart per turn by default
export const ENEMY_DAMAGE_HALVES = 1;

// Tile types and spawn probabilities
export const TILE_TYPES = {
  NORMAL: 'normal',
  RED: 'red',     // extra damage on word
  GREEN: 'green', // heals on word
  GRAY: 'gray',   // no damage on word
  FIRE: 'fire',   // environmental damage each turn
};

export const TILE_TYPE_PROBABILITIES = {
  red: 0.10,
  green: 0.10,
  gray: 0.10,
  fire: 0.08,
  // normal is implied as the remainder
};

// Dictionary sources
export const DICT_URLS = [
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
  'https://raw.githubusercontent.com/wordset/english-wordset/master/words.txt'
];