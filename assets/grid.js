// Grid rendering and selection
import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { makeTile, badgeFor, effectDescription } from './tiles.js';
import { state } from './state.js';
import { gridEl } from './dom.js';
import { updateWordUI, message } from './ui.js';

export function initGrid() {
  state.grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => makeTile())
  );
}

export function renderGrid() {
  gridEl.innerHTML = '';

  // Keep grid gap available to animations as a CSS variable
  try {
    const gap = window.getComputedStyle(gridEl).gap;
    if (gap) gridEl.style.setProperty('--grid-gap', gap);
  } catch {}

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const btn = document.createElement('button');
      btn.className = 'tile';
      btn.type = 'button';
      btn.setAttribute('data-pos', `${r},${c}`);

      const cell = state.grid[r][c];
      const key = `${r},${c}`;

      if (cell && cell.empty) {
        // Invisible placeholder to preserve layout while existing tiles drop
        btn.classList.add('empty');
        btn.setAttribute('aria-hidden', 'true');
        btn.innerHTML = '';
        gridEl.appendChild(btn);
        continue;
      }

      const typeClass = cell.type !== TILE_TYPES.NORMAL ? ` type-${cell.type}` : '';
      btn.className += typeClass;
      btn.setAttribute('aria-label', `Letter ${cell.ch}${cell.type !== TILE_TYPES.NORMAL ? ' ' + cell.type + ' tile' : ''}`);

      const badge = badgeFor(cell.type);
      btn.innerHTML = `<span class="ch">${cell.ch}</span>${badge ? `<span class="badge">${badge}</span>` : ''}`;

      if (cell.type && cell.type !== TILE_TYPES.NORMAL) {
        btn.title = effectDescription(cell.type);
      }

      if (state.selectedSet.has(key)) btn.classList.add('selected');

      // Phase 2: new tiles fall from the top
      if (state.refillAnimSet.has(key)) {
        btn.classList.add('fall-in');
        btn.style.animationDelay = `${r * 40}ms`;
      }

      // Phase 1: existing tiles dropping down
      if (state.dropAnimRowsMap && state.dropAnimRowsMap.size > 0) {
        const rows = state.dropAnimRowsMap.get(key);
        if (rows > 0) {
          btn.classList.add('drop');
          btn.style.setProperty('--drop-rows', String(rows));
        }
      }

      btn.addEventListener('click', () => onTileClick(r, c));
      gridEl.appendChild(btn);
    }
  }

  // Clear one-time animation flags
  state.refillAnimSet.clear();
  if (state.dropAnimRowsMap) state.dropAnimRowsMap.clear();

  // Maintain keyboard focus on a visible tile
  try {
    if (!state.keyboardFocus) state.keyboardFocus = { r: 0, c: 0 };
    const { r, c } = state.keyboardFocus;
    const preferred = gridEl.querySelector(`[data-pos="${r},${c}"]:not(.empty)`);
    const fallback = gridEl.querySelector('.tile:not(.empty)');
    const el = preferred || fallback;
    if (el) el.focus();
  } catch {}
}

export function onTileClick(r, c) {
  if (state.gameOver) return;
  const key = `${r},${c}`;
  if (state.selectedSet.has(key)) {
    state.selectedSet.delete(key);
    state.selected = state.selected.filter(p => !(p.r === r && p.c === c));
  } else {
    state.selectedSet.add(key);
    state.selected.push({ r, c });
  }
  updateWordUI();
  renderGridSelectionOnly();
}

export function renderGridSelectionOnly() {
  const children = gridEl.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const key = el.getAttribute('data-pos');
    if (state.selectedSet.has(key)) el.classList.add('selected');
    else el.classList.remove('selected');
  }
}

export function getCurrentWord() {
  return state.selected.map(p => state.grid[p.r][p.c].ch).join('');
}

export function clearSelection() {
  state.selected = [];
  state.selectedSet.clear();
  updateWordUI();
  renderGridSelectionOnly();
  message('');
}

export function refillUsedTiles(used) {
  // Phase 1: apply gravity to existing tiles, let them drop and settle.
  const usedSet = new Set(used.map(({ r, c }) => `${r},${c}`));
  state.refillAnimSet.clear();
  if (state.dropAnimRowsMap) state.dropAnimRowsMap.clear();

  const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  for (let c = 0; c < GRID_SIZE; c++) {
    // Collect tiles in this column that were not used, along with their original row
    const kept = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const key = `${r},${c}`;
      if (!usedSet.has(key)) kept.push({ tile: state.grid[r][c], oldRow: r });
    }
    const startRow = GRID_SIZE - kept.length;

    // Top empties (placeholders, invisible)
    for (let r = 0; r < startRow; r++) {
      newGrid[r][c] = { ch: '', type: null, empty: true };
    }

    // Pack kept tiles to the bottom, preserving their original order
    for (let i = 0; i < kept.length; i++) {
      const newRow = startRow + i;
      newGrid[newRow][c] = kept[i].tile;
      const drop = newRow - kept[i].oldRow;
      if (drop > 0) {
        state.dropAnimRowsMap.set(`${newRow},${c}`, drop);
      }
    }
  }

  state.grid = newGrid;
  renderGrid();

  // Phase 2: after drop animation completes, create new tiles at the top and animate them falling in.
  // Keep in sync with CSS: .tile.drop has 120ms delay + 0.9s duration = ~1050ms total
  const DROP_MS = 1050;
  setTimeout(() => {
    let needRefill = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (state.grid[r][c] && state.grid[r][c].empty) {
          state.grid[r][c] = makeTile(); // respects current spawn percentages/bias
          state.refillAnimSet.add(`${r},${c}`);
          needRefill = true;
        }
      }
    }
    if (needRefill) renderGrid();
  }, DROP_MS);
}

export function shuffleGrid() {
  if (state.gameOver) return;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      state.grid[r][c] = makeTile();
    }
  }
  clearSelection();
  renderGrid();
}