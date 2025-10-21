// Dictionary loader: prefer local words file by default, then fall back to remote sources.

import { DICT_URLS } from './constants.js';

function buildWordSet(text) {
  const words = text
    .split(/\r?\n/)
    .map(s => s.trim().toLowerCase())
    .filter(w => w.length >= 2 && /^[a-z]+$/.test(w));
  return new Set(words);
}

async function tryLoadFrom(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return buildWordSet(text);
}

export async function loadEnglishDictionary(urls = DICT_URLS) {
  // 1) Prefer local large dictionary
  try {
    const set = await tryLoadFrom('./assets/words.txt');
    return {
      set,
      isFallback: true,
      info: `Local dictionary loaded (${set.size.toLocaleString()} words)`
    };
  } catch {
    // continue to remote sources
  }

  // 2) Try remote sources
  for (const url of urls) {
    try {
      const set = await tryLoadFrom(url);
      return {
        set,
        isFallback: false,
        info: `Remote dictionary loaded (${set.size.toLocaleString()} words)`
      };
    } catch {
      // try next URL
    }
  }

  // 3) Finally, fallback to bundled small list
  try {
    const set = await tryLoadFrom('./assets/fallback-words.txt');
    return {
      set,
      isFallback: true,
      info: `Fallback dictionary loaded (${set.size.toLocaleString()} words)`
    };
  } catch {
    // no more options
  }

  throw new Error('Unable to load dictionary from local or remote sources.');
}