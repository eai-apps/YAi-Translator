/**
 * Статическая выгрузка готовых карточек топ-слов для офлайна (этап 15Б, версия 0.17.5).
 * Запуск: npm run cards:export
 * Создаёт public/cards/<lang>-<explain>/<prefix>.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CARDS_DIR = path.join(PUBLIC_DIR, 'cards');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache');
mkdirSync(CACHE_DIR, { recursive: true });

// Сборка TS модулей через esbuild
const helperOutfile = path.join(CACHE_DIR, 'cards-export-helper.mjs');
await build({
  entryPoints: [path.join(ROOT, 'shared', 'cardAssembler.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: helperOutfile,
  logLevel: 'silent',
});

const warmWordsOutfile = path.join(CACHE_DIR, 'warm-words-helper.mjs');
await build({
  entryPoints: [path.join(ROOT, 'shared', 'warmWords.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: warmWordsOutfile,
  logLevel: 'silent',
});

const lexiconOutfile = path.join(CACHE_DIR, 'lexicon-helper.mjs');
await build({
  entryPoints: [path.join(ROOT, 'shared', 'lexicon.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: lexiconOutfile,
  logLevel: 'silent',
});

const deRuOutfile = path.join(CACHE_DIR, 'de-ru-helper.mjs');
await build({
  entryPoints: [path.join(ROOT, 'src', 'data', 'commonTranslationsDeRu.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: deRuOutfile,
  logLevel: 'silent',
});

const { assembleWordCard } = await import(`${pathToFileURL(helperOutfile).href}?v=${Date.now()}`);
const { WARM_DE_WORDS, WARM_EN_WORDS } = await import(`${pathToFileURL(warmWordsOutfile).href}?v=${Date.now()}`);
const { getLexiconPrefix } = await import(`${pathToFileURL(lexiconOutfile).href}?v=${Date.now()}`);
const { getGermanTranslation } = await import(`${pathToFileURL(deRuOutfile).href}?v=${Date.now()}`);

// Кэш прочитанных файлов лексикона и примеров
const lexCache = new Map();
const exCache = new Map();

function loadLexiconEntry(lang, lemma) {
  const prefix = getLexiconPrefix(lemma);
  const cacheKey = `${lang}:${prefix}`;
  if (!lexCache.has(cacheKey)) {
    const filePath = path.join(PUBLIC_DIR, 'lex', lang, `${prefix}.json`);
    if (existsSync(filePath)) {
      try {
        lexCache.set(cacheKey, JSON.parse(readFileSync(filePath, 'utf-8')));
      } catch {
        lexCache.set(cacheKey, {});
      }
    } else {
      lexCache.set(cacheKey, {});
    }
  }
  const chunk = lexCache.get(cacheKey);
  const lower = lemma.toLowerCase();
  const cap = lemma.charAt(0).toUpperCase() + lemma.slice(1);
  let direct = null;

  if (lang === 'de') {
    // В немецком: если инфинитив глагола (-en/-eln/-ern) — приоритет глаголу, иначе существительному с заглавной
    if ((lower.endsWith('en') || lower.endsWith('eln') || lower.endsWith('ern')) && chunk[lower] && chunk[lower].pos === 'v') {
      direct = chunk[lower];
    } else if (chunk[cap] && chunk[cap].pos === 'n') {
      direct = chunk[cap];
    }
  }

  if (!direct) {
    direct = chunk[lemma] || chunk[cap] || chunk[lower];
  }
  if (!direct) return null;
  if (typeof direct === 'string') {
    return chunk[direct] || null;
  }
  if (direct && typeof direct.lemma === 'string' && !direct.pos) {
    return chunk[direct.lemma] || direct;
  }
  return direct;
}

function loadExamples(lang, lemma) {
  const prefix = getLexiconPrefix(lemma);
  const cacheKey = `${lang}:${prefix}`;
  if (!exCache.has(cacheKey)) {
    const filePath = path.join(PUBLIC_DIR, 'ex', lang, `${prefix}.json`);
    if (existsSync(filePath)) {
      try {
        exCache.set(cacheKey, JSON.parse(readFileSync(filePath, 'utf-8')));
      } catch {
        exCache.set(cacheKey, {});
      }
    } else {
      exCache.set(cacheKey, {});
    }
  }
  const chunk = exCache.get(cacheKey);
  const cap = lemma.charAt(0).toUpperCase() + lemma.slice(1);
  const lower = lemma.toLowerCase();
  return chunk[lemma] || chunk[cap] || chunk[lower] || [];
}

async function exportPair(lang, explainLang, words, limit = 1500) {
  const dirName = `${lang}-${explainLang}`;
  const outDir = path.join(CARDS_DIR, dirName);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const selectedWords = words.slice(0, limit);
  console.log(`[cards:export] Обработка ${lang}->${explainLang} (топ-${selectedWords.length} слов)...`);

  const prefixMap = new Map();
  let cardCount = 0;

  for (const word of selectedWords) {
    const entry = loadLexiconEntry(lang, word);
    const examples = loadExamples(lang, word);

    const cap = word.charAt(0).toUpperCase() + word.slice(1);
    const isDeNoun = lang === 'de' && entry?.pos === 'n';
    const lemma = isDeNoun ? cap : word;

    let translations = [];
    if (lang === 'de' && explainLang === 'ru') {
      const commonTr = getGermanTranslation(word) || getGermanTranslation(cap) || getGermanTranslation(word.toLowerCase());
      if (commonTr) {
        translations = commonTr.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
      }
    }

    const card = assembleWordCard({
      lemma,
      lang,
      explainLang,
      entry,
      translations,
      examples,
    });

    const prefix = getLexiconPrefix(word);
    if (!prefixMap.has(prefix)) {
      prefixMap.set(prefix, {});
    }
    const bucket = prefixMap.get(prefix);
    bucket[word.toLowerCase()] = card;
    if (card.lemma && card.lemma.toLowerCase() !== card.lemma) {
      bucket[card.lemma] = card;
    }
    cardCount++;
  }

  let totalBytes = 0;
  let fileCount = 0;
  for (const [prefix, cards] of prefixMap.entries()) {
    const filePath = path.join(outDir, `${prefix}.json`);
    const json = JSON.stringify(cards);
    writeFileSync(filePath, json, 'utf-8');
    totalBytes += Buffer.byteLength(json, 'utf-8');
    fileCount++;
  }

  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`[cards:export] Готово ${dirName}: ${cardCount} карточек в ${fileCount} файлах (${mb} MB).`);
  return { cardCount, fileCount, totalBytes };
}

async function main() {
  console.log('=== Сборка статических офлайн-карточек топ-слов ===');
  if (!existsSync(CARDS_DIR)) {
    mkdirSync(CARDS_DIR, { recursive: true });
  }

  // 1. Немецкий -> Русский (топ-1500)
  const deRu = await exportPair('de', 'ru', WARM_DE_WORDS, 1500);

  // 2. Английский -> Русский (топ-1500)
  const enRu = await exportPair('en', 'ru', WARM_EN_WORDS, 1500);

  // 3. Немецкий -> Английский (топ-1000)
  const deEn = await exportPair('de', 'en', WARM_DE_WORDS, 1000);

  // 4. Английский -> Немецкий (топ-1000)
  const enDe = await exportPair('en', 'de', WARM_EN_WORDS, 1000);

  const totalCards = deRu.cardCount + enRu.cardCount + deEn.cardCount + enDe.cardCount;
  const totalFiles = deRu.fileCount + enRu.fileCount + deEn.fileCount + enDe.fileCount;
  const totalMB = ((deRu.totalBytes + enRu.totalBytes + deEn.totalBytes + enDe.totalBytes) / (1024 * 1024)).toFixed(2);

  console.log(`\nИтог выгрузки:`);
  console.log(`- Всего карточек: ${totalCards}`);
  console.log(`- Всего файлов: ${totalFiles} (лимит Cloudflare Pages: 20 000)`);
  console.log(`- Общий размер: ${totalMB} MB`);
}

main().catch((err) => {
  console.error('Ошибка экспорта карточек:', err);
  process.exit(1);
});
