/**
 * Загрузка исходных файлов для сборки лексикона в node_modules/.cache/lexicon/
 */
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lexicon');

export const SOURCES = {
  freq: {
    url: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt',
    file: 'de_50k.txt',
  },
  nouns: {
    url: 'https://raw.githubusercontent.com/gambolputty/german-nouns/main/german_nouns/nouns.csv',
    file: 'nouns.csv',
  },
  kaikki: {
    url: 'https://kaikki.org/dictionary/German/kaikki.org-dictionary-German.jsonl',
    file: 'kaikki.jsonl',
  },
};

/** Загружает файл по url, если его ещё нет в кэше. */
export async function ensureFile(key) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const conf = SOURCES[key];
  if (!conf) throw new Error(`Unknown source key: ${key}`);
  const dest = path.join(CACHE_DIR, conf.file);
  if (existsSync(dest)) {
    console.log(`[lexicon] Используем кэш ${conf.file}`);
    return dest;
  }

  console.log(`[lexicon] Скачиваем ${conf.url} -> ${conf.file}...`);
  const res = await fetch(conf.url);
  if (!res.ok) throw new Error(`Failed to fetch ${conf.url}: ${res.status} ${res.statusText}`);
  const out = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body), out);
  console.log(`[lexicon] Скачано ${conf.file}`);
  return dest;
}
