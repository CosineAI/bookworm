// Dictionary loader with fallback
import { DICT_URLS } from './constants.js';
import { FALLBACK_WORDS } from './dictionaryFallback.js';

export async function loadEnglishDictionary(urls = DICT_URLS) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const words = text
        .split(/\r?\n/)
        .map(s => s.trim().toLowerCase())
        .filter(w => w.length >= 2 && /^[a-z]+$/.test(w));
      const set = new Set(words);
      return {
        set,
        isFallback: false,
        info: `Dictionary loaded (${set.size.toLocaleString()} words)`
      };
    } catch {
      // try next
    }
  }
  const set = new Set(FALLBACK_WORDS);
  return {
    set,
    isFallback: true,
    info: 'Offline mode: small fallback dictionary'
  };
}