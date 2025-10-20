// UI helpers and rendering
import { state } from './state.js';
import {
  gridEl,
  playerHeartsEl,
  enemyHeartsEl,
  messageEl,
  currentWordEl,
  letterCountEl,
  attackValEl,
  attackDisplayEl,
  submitBtn,
  logListEl,
  enemyNameEl,
  enemyStatusEl,
  equipmentListEl,
  mainEl,
} from './dom.js';
import { computeAttackInfo } from './compute.js';

export function renderHeartsTo(el, currentHalves, maxHearts) {
  if (!el) return;
  el.innerHTML = '';
  const full = Math.floor(currentHalves / 2);
  const half = currentHalves % 2;
  for (let i = 0; i < maxHearts; i++) {
    const span = document.createElement('span');
    span.className = 'heart';
    if (i < full) span.classList.add('full');
    else if (i === full && half) span.classList.add('half');
    else span.classList.add('empty');
    el.appendChild(span);
  }
}

export function renderHearts() {
  renderHeartsTo(playerHeartsEl, state.player.hp, state.player.maxHearts);
  renderHeartsTo(enemyHeartsEl, state.enemy.hp, state.enemy.maxHearts);
}

export function message(text, kind = '') {
  messageEl.textContent = text || '';
  messageEl.style.color = kind === 'bad' ? '#b91c1c' : '#374151';
}

export function floatDamage(targetEl, txt, kind = 'enemy') {
  const span = document.createElement('span');
  span.className = `damage-float ${kind}`;
  span.textContent = txt;
  const rect = targetEl.getBoundingClientRect();
  const hostRect = mainEl.getBoundingClientRect();
  span.style.left = `${rect.left - hostRect.left + rect.width / 2 - 8}px`;
  span.style.top = `${rect.top - hostRect.top + 8}px`;
  mainEl.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}

export function renderLog() {
  if (!logListEl) return;
  logListEl.innerHTML = '';
  const arr = state.logCollapsed ? state.logLines.slice(-5) : state.logLines;
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = document.createElement('div');
    p.textContent = arr[i];
    logListEl.appendChild(p);
  }
}

export function log(line) {
  state.logLines.push(line);
  renderLog();
}

export function updateEnemyNameUI() {
  if (!enemyNameEl) return;
  enemyNameEl.textContent = state.enemy?.name ? state.enemy.name : 'Enemy';
}

export function formatHearts(halves) {
  const hearts = halves / 2;
  if (hearts === 0.5) return '½ heart';
  if (Number.isInteger(hearts)) return `${hearts} heart${hearts === 1 ? '' : 's'}`;
  return `${hearts} hearts`;
}

export function updateEnemyStatusUI() {
  if (!enemyStatusEl) return;

  let halves = state.enemy?.damageHalvesPerTurn || 0;
  const isSpecialNext = state.enemySpecial.every != null && state.enemySpecial.countdown <= 1;
  if (isSpecialNext && state.enemy.special?.damageMult) {
    halves *= state.enemy.special.damageMult;
  }
  if (state.nextEnemyAttackHalved) {
    halves = Math.floor(halves / 2);
  }

  let actionText = '';
  if (isSpecialNext && Array.isArray(state.enemy.special?.actions)) {
    const parts = [];
    for (const a of state.enemy.special.actions) {
      const count = Math.max(1, a.count | 0);
      if (a.type === 'gray_tiles') parts.push(`turn ${count} tile${count > 1 ? 's' : ''} gray`);
      if (a.type === 'fire_tiles') parts.push(`turn ${count} tile${count > 1 ? 's' : ''} fire`);
    }
    if (parts.length > 0) {
      actionText = ' + ' + parts.join(' + ');
    }
  }

  const msg = `Will deal ${formatHearts(halves)} next turn${actionText}`;
  enemyStatusEl.textContent = msg;
  enemyStatusEl.classList.remove('charging');
}

export function renderEquipment() {
  if (!equipmentListEl) return;
  equipmentListEl.innerHTML = '';
  if (!state.equippedItems || state.equippedItems.length === 0) {
    equipmentListEl.textContent = '—';
    return;
  }
  for (const it of state.equippedItems) {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = it.name;
    if (it.desc) {
      pill.title = it.desc;
      pill.setAttribute('aria-label', `${it.name}: ${it.desc}`);
    } else {
      pill.title = it.name;
      pill.setAttribute('aria-label', it.name);
    }
    equipmentListEl.appendChild(pill);
  }
}

export function updateWordUI() {
  const w = state.selected.map(p => state.grid[p.r][p.c].ch).join('');
  currentWordEl.textContent = w || '(none)';
  const { attackHalves, letters } = computeAttackInfo();
  letterCountEl.textContent = String(letters);
  attackValEl.textContent = String(attackHalves);
  attackDisplayEl.textContent = String(attackHalves);
  submitBtn.disabled = state.gameOver || letters < 2;
}

// Accessibility keyboard helpers
export function attachGridKeyboard() {
  gridEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const pos = e.target.getAttribute('data-pos');
      if (pos) {
        const [r, c] = pos.split(',').map(Number);
        const ev = new CustomEvent('grid:tile-click', { detail: { r, c } });
        window.dispatchEvent(ev);
      }
    }
  });
}