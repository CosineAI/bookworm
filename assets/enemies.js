// Enemy definitions with increasing difficulty and optional special cadences.
// Specials occur on a fixed cadence and can apply deterministic debuffs and/or damage multipliers.

import { Enemy } from './combatants.js';

export const ENEMIES = [
  {
    name: 'Slime',
    kind: 'slime',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [],
    special: { every: 4, damageMult: 2, actions: [] } // x2 damage every 4 turns
  },
  {
    name: 'Goblin',
    kind: 'goblin',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [],
    special: { every: 5, damageMult: 3, actions: [] } // x3 damage every 5 turns
  },
  // New mid-tier enemies
  {
    name: 'Bandit',
    kind: 'bandit',
    maxHearts: 6,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [],
    special: { every: 4, damageMult: 1, actions: [{ type: 'fire_tiles', count: 2 }] } // 2 fire tiles every 4 turns, normal dmg
  },
  {
    name: 'Kobold',
    kind: 'kobold',
    maxHearts: 7,
    damageHalvesPerTurn: 1, // ½ heart
    debuffs: [],
    special: { every: 4, damageMult: 1, actions: [{ type: 'gray_tiles', count: 1 }] } // mild gray pressure
  },
  {
    name: 'Orc',
    kind: 'orc',
    maxHearts: 7,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [],
    special: { every: 5, damageMult: 2, actions: [{ type: 'gray_tiles', count: 3 }] } // 3 gray + x2 dmg
  },
  {
    name: 'Troll',
    kind: 'troll',
    maxHearts: 8,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [],
    special: { every: 5, damageMult: 2, actions: [{ type: 'gray_tiles', count: 4 }] } // 4 gray + x2 dmg
  },
  {
    name: 'Ogre Brute',
    kind: 'ogre',
    maxHearts: 8,
    damageHalvesPerTurn: 2, // 1 heart
    debuffs: [],
    special: { every: 5, damageMult: 1, actions: [{ type: 'gray_tiles', count: 2 }, { type: 'fire_tiles', count: 1 }] } // 2 gray + 1 fire
  },
  {
    name: 'Warlock',
    kind: 'warlock',
    maxHearts: 7,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [],
    special: { every: 1, damageMult: 1, actions: [{ type: 'gray_tiles', count: 1 }] } // 1 gray every turn
  },
  {
    name: 'Wyvern',
    kind: 'wyvern',
    maxHearts: 9,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [],
    special: { every: 4, damageMult: 2, actions: [{ type: 'fire_tiles', count: 3 }] } // 3 fire every 4 turns + x2 dmg
  },
  {
    name: 'Dragon Whelp',
    kind: 'dragon',
    maxHearts: 9,
    damageHalvesPerTurn: 3, // 1½ hearts
    debuffs: [],
    special: { every: 1, damageMult: 1, actions: [{ type: 'fire_tiles', count: 1 }] } // 1 fire every turn
  }
];

export function createEnemy(def) {
  return new Enemy(
    def.maxHearts,
    def.damageHalvesPerTurn,
    def.kind,
    { name: def.name, desc: def.desc || '', debuffs: def.debuffs || [], special: def.special || null }
  );
}