// Dictionary loader (no local fallback)
// If remote sources fail, throws an error so UI can inform the player.

import { DICT_URLS } from './constants.js';

async function tryLoadFrom(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const words = text
    .split(/\r?\n/)
    .map(s => s.trim().toLowerCase())
    .filter(w => w.length >= 2 && /^[a-z]+$/.test(w));
  return new Set(words);
}

export async function loadEnglishDictionary(urls = DICT_URLS) {
  for (const url of urls) {
    try {
      const set = await tryLoadFrom(url);
      return {
        set,
        isFallback: false,
        info: `Dictionary loaded (${set.size.toLocaleString()} words)`
      };
    } catch {
      // try next URL
    }
  }
  throw new Error('Unable to load dictionary from remote sources.');
}