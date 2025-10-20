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
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.type = 'button';
      tile.setAttribute('data-pos', `${r},${c}`);
      const cell = state.grid[r][c];
      const typeClass = cell.type !== TILE_TYPES.NORMAL ? ` type-${cell.type}` : '';
      tile.className += typeClass;
      tile.setAttribute('aria-label', `Letter ${cell.ch}${cell.type !== TILE_TYPES.NORMAL ? ' ' + cell.type + ' tile' : ''}`);
      const badge = badgeFor(cell.type);
      tile.innerHTML = `<span class=\"ch\">${cell.ch}</span>${badge ? `<span class=\"badge\">${badge}</span>` : ''}`;
      if (cell.type && cell.type !== TILE_TYPES.NORMAL) {
        tile.title = effectDescription(cell.type);
      }
      const key = `${r},${c}`;
      if (state.selectedSet.has(key)) tile.classList.add('selected');
      if (state.refillAnimSet.has(key)) {
        tile.classList.add('fall-in');
        tile.style.animationDelay = `${r * 40}ms`;
      }
      tile.addEventListener('click', () => onTileClick(r, c));
      gridEl.appendChild(tile);
    }
  }
  state.refillAnimSet.clear();
  try {
    if (!state.keyboardFocus) state.keyboardFocus = { r: 0, c: 0 };
    const btn = gridEl.querySelector(`[data-pos="${state.keyboardFocus.r},${state.keyboardFocus.c}"]`) || gridEl.querySelector('.tile');
    if (btn) btn.focus();
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
  state.refillAnimSet.clear();
  for (const { r, c } of used) {
    state.grid[r][c] = makeTile();
    state.refillAnimSet.add(`${r},${c}`);
  }
  renderGrid();
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