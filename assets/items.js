// Item definitions extracted as a module. Items capture context for apply handlers.
export function createItemPool(ctx) {
  const { activeEffects, setSpawnBias, player, renderHearts } = ctx;

  // Safe helpers in case functions are missing in context
  const safeSetSpawnBias = (bias) => {
    if (typeof setSpawnBias === 'function') {
      setSpawnBias(bias);
    }
  };
  const safeRenderHearts = () => {
    if (typeof renderHearts === 'function') {
      renderHearts();
    }
  };

  return [
    { key: 'holyVowel', name: 'Holy Vowel', desc: 'Double attack for vowels (A, E, I, O, U).',
      apply: () => { activeEffects.holyVowel = true; } },
    { key: 'fireproof', name: 'Fireproof', desc: 'Fire tiles deal half damage (rounded down).',
      apply: () => { activeEffects.fireproof = true; } },
    { key: 'healingStaff', name: 'Healing Staff', desc: 'Green tiles heal a full heart.',
      apply: () => { activeEffects.healingStaff = true; } },
    { key: 'redEnhanced', name: 'Reddy For Action', desc: 'Red tiles deal an additional double damage.',
      apply: () => { activeEffects.redEnhanced = true; } },
    { key: 'grayGoggles', name: 'Gray Goggles', desc: 'Gray tiles deal half damage.',
      apply: () => { activeEffects.grayGoggles = true; } },
    { key: 'fireWarAxe', name: 'Firey War Axe', desc: 'Adds ½ heart damage per fire tile on the field to each attack.',
      apply: () => { activeEffects.fireWarAxe = true; } },

    // Blessings: triple spawn chance of a tile type
    { key: 'blessRed', name: 'Blessing of Red', desc: 'Red tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ red: 3 }); } },
    { key: 'blessGreen', name: 'Blessing of Green', desc: 'Green tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ green: 3 }); } },
    { key: 'blessGray', name: 'Blessing of Gray', desc: 'Gray tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ gray: 3 }); } },
    { key: 'blessFire', name: 'Blessing of Fire', desc: 'Fire tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ fire: 3 }); } },
    { key: 'blessPoison', name: 'Blessing of Poison', desc: 'Poison tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ poison: 3 }); } },
    { key: 'blessCursed', name: 'Blessing of Cursed', desc: 'Cursed tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ cursed: 3 }); } },
    { key: 'blessIce', name: 'Blessing of Ice', desc: 'Frozen tiles appear three times as often.',
      apply: () => { safeSetSpawnBias({ frozen: 3 }); } },

    // Permanent max-heart upgrades
    { key: 'metaphorMail', name: 'Metaphor Mail', desc: '+3 max hearts (permanent).',
      apply: () => { player.maxHearts += 3; safeRenderHearts(); } },
    { key: 'simileShield', name: 'Simile Shield', desc: '+2 max hearts (permanent).',
      apply: () => { player.maxHearts += 2; safeRenderHearts(); } },
    { key: 'personificationPlate', name: 'Personification Plate', desc: '+2 max hearts (permanent).',
      apply: () => { player.maxHearts += 2; safeRenderHearts(); } },

    // Defensive item
    { key: 'frozenArmor', name: 'Frozen Armor', desc: 'Prevent ½ heart of damage for each Frozen tile on the grid.',
      apply: () => { activeEffects.frozenArmor = true; } },
  ];
}