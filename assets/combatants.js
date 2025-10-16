// Minimal combatant classes to allow future expansion (weapons, enemy types)
import { HALF } from './constants.js';

export class Combatant {
  constructor(maxHearts) {
    this.maxHearts = maxHearts;
    this.hp = maxHearts * HALF; // stored in half-hearts
  }
  takeDamage(halves) {
    this.hp = Math.max(0, this.hp - Math.max(0, halves|0));
  }
  heal(halves) {
    this.hp = Math.min(this.maxHearts * HALF, this.hp + Math.max(0, halves|0));
  }
  isDead() {
    return this.hp <= 0;
  }
}

export class Enemy extends Combatant {
  constructor(maxHearts, damageHalvesPerTurn = 1, kind = 'default', options = {}) {
    super(maxHearts);
    this.damageHalvesPerTurn = damageHalvesPerTurn;
    this.kind = kind;
    this.name = options.name || kind;
    this.desc = options.desc || '';
    this.debuffs = Array.isArray(options.debuffs) ? options.debuffs : [];
  }
}