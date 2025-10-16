// Enemy definitions with increasing difficulty and optional debuffs.
// Debuffs are applied on enemy turns. This is a seed set you can tweak.

import { Enemy } from './combatants.js';

export const ENEMIES = [
  {
    name: 'Slime',
    kind: 'slime',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: []
  },
  {
    name: 'Goblin',
    kind: 'goblin',
    maxHearts: 6,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.12, count: 1 }
    ]
  },
  {
    name: 'Orc',
    kind: 'orc',
    maxHearts: 7,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.16, count: 1 }
    ]
  },
  {
    name: 'Troll',
    kind: 'troll',
    maxHearts: 8,
    damageHalvesPerTurn: 4, // 2 hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.20, count: 2 }
    ]
  },
  {
    name: 'Warlock',
    kind: 'warlock',
    maxHearts: 7,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.25, count: 2 }
    ]
  },
  {
    name: 'Dragon Whelp',
    kind: 'dragon',
    maxHearts: 9,
    damageHalvesPerTurn: 5, // 2½ hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.30, count: 3 }
    ]
  }
];

export function createEnemy(def) {
  return new Enemy(
    def.maxHearts,
    def.damageHalvesPerTurn,
    def.kind,
    { name: def.name, desc: def.desc || '', debuffs: def.debuffs || [] }
  );
}