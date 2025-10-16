// Letter distribution and helpers

// Approximate Scrabble-like frequencies for better wordability
const frequencyDist = [
  ['E',12], ['A',9], ['I',9], ['O',8], ['N',6], ['R',6], ['T',6], ['L',4], ['S',4], ['U',4],
  ['D',4], ['G',3], ['B',2], ['C',2], ['M',2], ['P',2], ['F',2], ['H',2], ['V',2], ['W',2], ['Y',2],
  ['K',1], ['J',1], ['X',1], ['Q',1], ['Z',1]
];

const weightedLetters = (() => {
  const arr = [];
  for (const [ch, n] of frequencyDist) for (let i=0;i<n;i++) arr.push(ch);
  return arr;
})();

function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function randomLetter() {
  return randChoice(weightedLetters);
}

// Damage weighting by rarity (four tiers):
// - Tier 1 (most common; weight >= 8): 1 half-heart
// - Tier 2 (weight 4–7): 2 half-hearts
// - Tier 3 (weight 2–3): 3 half-hearts
// - Tier 4 (weight 1): 4 half-hearts
const weightByLetter = (() => {
  const map = new Map();
  for (const [ch, n] of frequencyDist) map.set(ch, n);
  return map;
})();

export function letterDamageHalves(ch) {
  const up = String(ch || '').toUpperCase();
  const freq = weightByLetter.get(up) || 1;
  if (freq >= 8) return 1;      // Tier 1
  if (freq >= 4) return 2;      // Tier 2
  if (freq >= 2) return 3;      // Tier 3
  return 4;                     // Tier 4
}