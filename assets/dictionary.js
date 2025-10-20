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
  // Try local dictionaries first
  const LOCAL_PATHS = [
    './assets/words.txt',            // newly added large local dictionary
    './assets/fallback-words.txt',   // existing fallback
  ];

  for (const path of LOCAL_PATHS) {
    try {
      const set = await tryLoadFrom(path);
      return {
        set,
        isFallback: true,
        info: `Local dictionary loaded (${set.size.toLocaleString()} words)`
      };
    } catch {
      // try next local path
    }
  }

  // Fall back to remote sources
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

  throw new Error('Unable to load dictionary from local or remote sources.');
}