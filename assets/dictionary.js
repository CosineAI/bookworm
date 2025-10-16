// Dictionary loader with fallback
import { DICT_URLS } from './constants.js';
import { FALLBACK_WORDS } from './dictionaryFallback.js';

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
  // 1) Try large remote dictionaries
  for (const url of urls) {
    try {
      const set = await tryLoadFrom(url);
      return {
        set,
        isFallback: false,
        info: `Dictionary loaded (${set.size.toLocaleString()} words)`
      };
    } catch {
      // try next
    }
  }

  // 2) Try local on-disk fallback file (bundled with the game)
  try {
    const set = await tryLoadFrom('assets/fallback-words.txt');
    return {
      set,
      isFallback: true,
      info: `Local fallback dictionary loaded (${set.size.toLocaleString()} words)`
    };
  } catch {
    // ignore and try built-in
  }

  // 3) Built-in tiny fallback (JS array)
  const set = new Set(FALLBACK_WORDS);
  return {
    set,
    isFallback: true,
    info: 'Offline mode: small fallback dictionary'
  };
}