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
  POISON: 'poison', // halves enemy's next attack when used
  CURSED: 'cursed', // odd count halves total attack; even count x1.5
};

export const TILE_TYPE_PROBABILITIES = {
  // Halved frequencies for specials
  red: 0.05,
  green: 0.05,
  gray: 0.05,
  fire: 0.04,
  poison: 0.04,
  cursed: 0.04,
  // normal is implied as the remainder
};

// Long word bonus (applied to total attack)
// threshold: words longer than this get a bonus
// perExtraLetterHalves: additional half-hearts per letter beyond threshold (float allowed)
export const LONG_WORD_BONUS = {
  threshold: 6,
  perExtraLetterHalves: 0.5, // +0.5 halves (= +0.25 heart) per letter beyond 6
};

// Dictionary sources
export const DICT_URLS = [
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
  'https://raw.githubusercontent.com/wordset/english-wordset/master/words.txt'
];