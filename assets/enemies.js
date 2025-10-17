// Enemy definitions with increasing difficulty and optional debuffs.
// Debuffs are applied on enemy turns. This is a seed set you can tweak.

import { Enemy } from './combatants.js';

export const ENEMIES = [
  {
    name: 'Slime',
    kind: 'slime',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.04, count: 1 },
      { type: 'fire_tiles', chance: 0.04, count: 1 }
    ]
  },
  {
    name: 'Goblin',
    kind: 'goblin',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.04, count: 1 },
      { type: 'fire_tiles', chance: 0.08, count: 1 }
    ]
  },
  // New mid-tier enemies
  {
    name: 'Bandit',
    kind: 'bandit',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.08, count: 1 },
      { type: 'fire_tiles', chance: 0.06, count: 1 }
    ]
  },
  {
    name: 'Kobold',
    kind: 'kobold',
    maxHearts: 7,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.10, count: 1 },
      { type: 'fire_tiles', chance: 0.08, count: 1 }
    ]
  },
  {
    name: 'Orc',
    kind: 'orc',
    maxHearts: 7,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.12, count: 1 },
      { type: 'fire_tiles', chance: 0.08, count: 1 }
    ]
  },
  {
    name: 'Troll',
    kind: 'troll',
    maxHearts: 8,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.12, count: 2 },
      { type: 'fire_tiles', chance: 0.12, count: 2 }
    ]
  },
  {
    name: 'Ogre Brute',
    kind: 'ogre',
    maxHearts: 8,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [
      { type: 'gray_tiles', chance: 0.14, count: 2 },
      { type: 'fire_tiles', chance: 0.10, count: 2 }
    ]
  },
  {
    name: 'Warlock',
    kind: 'warlock',
    maxHearts: 7,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.20, count: 2 },
      { type: 'fire_tiles', chance: 0.08, count: 2 } // assumed 0.08 (8%) per request (likely typo from 0.8)
    ]
  },
  {
    name: 'Wyvern',
    kind: 'wyvern',
    maxHearts: 9,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.18, count: 2 },
      { type: 'fire_tiles', chance: 0.16, count: 2 }
    ]
  },
  {
    name: 'Dragon Whelp',
    kind: 'dragon',
    maxHearts: 9,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [
      { type: 'gray_tiles', chance: 0.08, count: 3 },
      { type: 'fire_tiles', chance: 0.20, count: 3 }
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