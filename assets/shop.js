// Shop overlay logic
import { HALF } from './constants.js';
import { setSpawnBias } from './tiles.js';
import { state } from './state.js';
import {
  shopOverlay,
  healBtn,
  item1NameEl,
  item1DescEl,
  item2NameEl,
  item2DescEl,
  equipItem1Btn,
  equipItem2Btn,
} from './dom.js';
import { renderHearts, renderEquipment, log } from './ui.js';
import { createItemPool } from './items.js';

let shopItems = [];

function pickRandomItems(pool, n = 2) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function renderShopItems() {
  const [a, b] = shopItems;

  if (a) {
    item1NameEl.textContent = a.name;
    item1DescEl.textContent = a.desc;
    equipItem1Btn.disabled = false;
  } else {
    item1NameEl.textContent = 'Sold out';
    item1DescEl.textContent = 'No items available.';
    equipItem1Btn.disabled = true;
  }

  if (b) {
    item2NameEl.textContent = b.name;
    item2DescEl.textContent = b.desc;
    equipItem2Btn.disabled = false;
  } else {
    item2NameEl.textContent = 'Sold out';
    item2DescEl.textContent = 'No items available.';
    equipItem2Btn.disabled = true;
  }
}

export function openShop() {
  state.shopSelectionMade = false;

  const poolAll = createItemPool({ activeEffects: state.activeEffects, setSpawnBias, player: state.player, renderHearts });
  const owned = new Set((state.equippedItems || []).map(it => it.key));
  const pool = poolAll.filter(item => !owned.has(item.key));

  shopItems = pickRandomItems(pool.length > 0 ? pool : poolAll, 2);
  renderShopItems();

  healBtn.disabled = false;

  shopOverlay.classList.add('show');
  shopOverlay.setAttribute('aria-hidden', 'false');
}

export function closeShop() {
  shopOverlay.classList.remove('show');
  shopOverlay.setAttribute('aria-hidden', 'true');
}

export function selectHeal() {
  if (state.shopSelectionMade) return;
  const before = state.player.hp;
  state.player.heal(state.player.maxHearts * HALF);
  const healedHearts = (state.player.hp - before) / 2;
  renderHearts();
  if (healedHearts > 0) {
    log(`Shop: Healed ${healedHearts} heart${healedHearts === 1 ? '' : 's'}.`);
  } else {
    log('Shop: You are already at full health.');
  }
  state.shopSelectionMade = true;
  healBtn.disabled = true;
  equipItem1Btn.disabled = true;
  equipItem2Btn.disabled = true;

  closeShop();
  window.dispatchEvent(new CustomEvent('shop:proceed'));
}

export function equipItem(index) {
  if (state.shopSelectionMade) return;
  state.shopSelectionMade = true;

  let item = shopItems && shopItems[index];

  try {
    if (item && typeof item.apply === 'function') {
      item.apply();
      if (!state.equippedItems.find(it => it.key === item.key)) {
        state.equippedItems.push({ key: item.key, name: item.name, desc: item.desc });
      }
      renderEquipment();
      log(`Shop: Equipped ${item.name}.`);
    } else {
      log('Shop: No item available to equip. Proceeding to next battle.');
    }
  } catch (e) {
    console.error('Equip error:', e);
    log(`Shop: Failed to equip item due to an error (${e && e.message ? e.message : 'unknown'}). Proceeding to next battle.`);
  } finally {
    try { if (healBtn) healBtn.disabled = true; } catch {}
    try { if (equipItem1Btn) equipItem1Btn.disabled = true; } catch {}
    try { if (equipItem2Btn) equipItem2Btn.disabled = true; } catch {}

    closeShop();
    window.dispatchEvent(new CustomEvent('shop:proceed'));
  }
}