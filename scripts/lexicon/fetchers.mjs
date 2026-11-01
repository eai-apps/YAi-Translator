/**
 * Загрузка исходных файлов для сборки лексикона в node_modules/.cache/lexicon/
 */
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lexicon');

export const LANGUAGE_KAIKKI_NAMES = {
  de: 'German',
  en: 'English',
  ru: 'Russian',
  uk: 'Ukrainian',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  pl: 'Polish',
  nl: 'Dutch',
  tr: 'Turkish',
  ar: 'Arabic',
};

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

/** Загружает частотный список для указанного языка */
export async function ensureFrequencyFile(lang) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const fileName = `${lang}_50k.txt`;
  const dest = path.join(CACHE_DIR, fileName);
  if (existsSync(dest)) {
    console.log(`[lexicon] Используем кэш частотного списка ${fileName}`);
    return dest;
  }

  const url = `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${lang}/${lang}_50k.txt`;
  console.log(`[lexicon] Скачиваем частотный список ${url} -> ${fileName}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch frequency list ${url}: ${res.status}`);
  const out = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body), out);
  console.log(`[lexicon] Скачан ${fileName}`);
  return dest;
}

/** Загружает выгрузку Kaikki для указанного языка */
export async function ensureKaikkiFile(lang) {
  mkdirSync(CACHE_DIR, { recursive: true });

  // Проверяем существующие варианты (kaikki.jsonl для de, kaikki-en.jsonl и т.д.)
  const possibleFiles = [
    `kaikki-${lang}.jsonl`,
    lang === 'de' ? 'kaikki.jsonl' : null,
  ].filter(Boolean);

  for (const f of possibleFiles) {
    const dest = path.join(CACHE_DIR, f);
    if (existsSync(dest)) {
      console.log(`[lexicon] Используем кэш Kaikki ${f}`);
      return dest;
    }
  }

  const name = LANGUAGE_KAIKKI_NAMES[lang];
  if (!name) throw new Error(`Unsupported Kaikki language: ${lang}`);

  const fileName = `kaikki-${lang}.jsonl`;
  const dest = path.join(CACHE_DIR, fileName);
  const url = `https://kaikki.org/dictionary/${name}/kaikki.org-dictionary-${name}.jsonl`;

  console.log(`[lexicon] Скачиваем выгрузку Kaikki для ${name} (${url})...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Kaikki for ${name}: ${res.status}`);
  const out = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body), out);
  console.log(`[lexicon] Скачан ${fileName}`);
  return dest;
}
