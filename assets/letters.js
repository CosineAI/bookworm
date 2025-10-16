// Letter distribution and helpers

// Approximate Scrabble-like frequencies for better wordability
const weightedLetters = (() => {
  const dist = [
    ['E',12], ['A',9], ['I',9], ['O',8], ['N',6], ['R',6], ['T',6], ['L',4], ['S',4], ['U',4],
    ['D',4], ['G',3], ['B',2], ['C',2], ['M',2], ['P',2], ['F',2], ['H',2], ['V',2], ['W',2], ['Y',2],
    ['K',1], ['J',1], ['X',1], ['Q',1], ['Z',1]
  ];
  const arr = [];
  for (const [ch, n] of dist) for (let i=0;i<n;i++) arr.push(ch);
  return arr;
})();

function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function randomLetter() {
  return randChoice(weightedLetters);
}