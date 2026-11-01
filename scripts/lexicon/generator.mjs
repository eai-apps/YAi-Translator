/**
 * Сборка лексикона: объединение данных, разделение по 2-буквенным файлам,
 * сохранение warm-words.txt и метаданных (этапы 11, 14).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

export function getPrefix(word) {
  const clean = word.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (clean.length < 2) return 'other';
  return clean.slice(0, 2);
}

export function getLexiconPrefix(word) {
  return getPrefix(word);
}

/** Сборка лексикона для любого языка (en, ru, uk, fr, etc.) */
export async function buildLanguageLexiconDatabase({ lang, entries, formToLemma, frequencyList = [] }) {
  const outDir = path.join(ROOT, 'public', 'lex', lang);
  mkdirSync(outDir, { recursive: true });
  console.log(`[lexicon] Формируем лексикон для ${lang}...`);

  const chunks = new Map(); // prefix -> { [word]: entry }
  let totalLemmas = 0;

  function putEntry(word, entry) {
    const prefix = getPrefix(word);
    if (!chunks.has(prefix)) chunks.set(prefix, {});
    const chunk = chunks.get(prefix);
    if (!chunk[word]) {
      chunk[word] = entry;
    }
  }

  // 1. Сначала добавляем леммы по частотному списку
  const processedLemmas = new Set();
  for (const word of frequencyList) {
    const entry = entries.get(word) || entries.get(word.toLowerCase());
    if (entry && !processedLemmas.has(word)) {
      processedLemmas.add(word);
      totalLemmas++;
      const { forms, ...data } = entry;
      putEntry(word, data);
      for (const form of forms || []) {
        putEntry(form, { lemma: word });
      }
    }
  }

  // 2. Добавляем остальные леммы, у которых есть переводы или формы
  for (const [word, entry] of entries) {
    if (!processedLemmas.has(word)) {
      processedLemmas.add(word);
      totalLemmas++;
      const { forms, ...data } = entry;
      putEntry(word, data);
      for (const form of forms || []) {
        putEntry(form, { lemma: word });
      }
    }
  }

  // 3. Добавляем оставшиеся формы, если они не были добавлены
  if (formToLemma) {
    for (const [form, lemma] of formToLemma) {
      if (processedLemmas.has(lemma)) {
        putEntry(form, { lemma });
      }
    }
  }

  // 4. Записываем файлы шардов public/lex/<lang>/<prefix>.json
  let totalBytes = 0;
  let totalEntries = 0;
  for (const [prefix, chunkEntries] of chunks) {
    const content = JSON.stringify(chunkEntries);
    const byteLength = Buffer.byteLength(content, 'utf8');
    totalBytes += byteLength;
    totalEntries += Object.keys(chunkEntries).length;
    writeFileSync(path.join(outDir, `${prefix}.json`), content, 'utf8');
  }

  console.log(`[lexicon] [${lang}] Записано ${chunks.size} файлов, ${totalEntries} записей (${totalLemmas} лемм), ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  // 5. Записываем public/lex/<lang>/meta.json
  const meta = {
    version: '1.0.0',
    lang,
    date: new Date().toISOString().slice(0, 10),
    entries: totalEntries,
    lemmas: totalLemmas,
    sources: [
      { name: 'kaikki.org (wiktextract)', url: `https://kaikki.org/dictionary/${lang}/`, license: 'CC BY-SA 4.0' },
      { name: 'FrequencyWords', url: 'https://github.com/hermitdave/FrequencyWords', license: 'MIT' },
    ],
  };
  writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
  return { totalEntries, totalLemmas, totalBytes, totalFiles: chunks.size };
}

/** Сборка лексикона немецкого языка (этап 11 + обогащение tr для этапа 14) */
export async function buildLexiconDatabase({
  frequencyList,
  nouns,
  verbs,
  adjs,
  ipaMap,
  translationsMap = new Map(),
  crossTranslations = new Map(),
}) {
  const outDir = path.join(ROOT, 'public', 'lex', 'de');
  mkdirSync(outDir, { recursive: true });
  console.log('[lexicon] Формируем немецкий лексикон (с переводами tr)...');

  const chunks = new Map();
  const warmLemmas = [];
  const processedLemmas = new Set();

  function putEntry(word, entry) {
    const prefix = getPrefix(word);
    if (!chunks.has(prefix)) chunks.set(prefix, {});
    const chunk = chunks.get(prefix);
    if (!chunk[word]) {
      chunk[word] = entry;
    }
  }

  function resolveGermanTr(word) {
    const tr = {};
    const lower = word.toLowerCase();

    // 1. Из Kaikki немецких переводов или перекрестных переводов
    const fromKaikki = translationsMap.get(word) || translationsMap.get(lower);
    if (fromKaikki) {
      for (const [code, list] of Object.entries(fromKaikki)) {
        if (!tr[code]) tr[code] = [...list];
        else {
          for (const item of list) {
            if (!tr[code].includes(item) && tr[code].length < 4) tr[code].push(item);
          }
        }
      }
    }

    // 3. Из перекрестных переводов английского Kaikki (de -> ru/en/uk)
    const cross = crossTranslations.get(lower) || crossTranslations.get(word);
    if (cross) {
      for (const [code, list] of Object.entries(cross)) {
        if (!tr[code]) tr[code] = [...list];
        else {
          for (const item of list) {
            if (!tr[code].includes(item) && tr[code].length < 4) tr[code].push(item);
          }
        }
      }
    }

    return Object.keys(tr).length > 0 ? tr : undefined;
  }

  // 1. Проходим по частотному списку слов
  for (const word of frequencyList) {
    if (processedLemmas.size >= 32000) break;
    const cleanWord = word.trim();
    if (!cleanWord || cleanWord.length < 2) continue;

    // Существительные
    const cap = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    const noun = nouns.get(cap) || nouns.get(cleanWord);
    if (noun && !processedLemmas.has(cap)) {
      processedLemmas.add(cap);
      const ipa = ipaMap.get(cap) || ipaMap.get(cleanWord);
      const tr = resolveGermanTr(cap);
      putEntry(cap, {
        pos: 'n',
        g: noun.g,
        ...(noun.pl ? { pl: noun.pl } : {}),
        ...(noun.gen ? { gen: noun.gen } : {}),
        ...(ipa ? { ipa } : {}),
        ...(tr ? { tr } : {}),
      });
      for (const form of noun.forms || []) {
        putEntry(form, { lemma: cap });
      }
      if (warmLemmas.length < 3000 && cap.length >= 3 && !['Der', 'Die', 'Das', 'Ein', 'Eine', 'Ist'].includes(cap)) {
        warmLemmas.push(cap);
      }
      continue;
    }

    // Глаголы
    const lower = cleanWord.toLowerCase();
    const verb = verbs.get(lower);
    if (verb && !processedLemmas.has(lower)) {
      processedLemmas.add(lower);
      const tr = resolveGermanTr(lower);
      putEntry(lower, {
        pos: 'v',
        ...(verb.p3 ? { p3: verb.p3 } : {}),
        ...(verb.prt ? { prt: verb.prt } : {}),
        ...(verb.p2 ? { p2: verb.p2 } : {}),
        ...(verb.aux ? { aux: verb.aux } : {}),
        ...(verb.ipa ? { ipa: verb.ipa } : {}),
        ...(tr ? { tr } : {}),
      });
      for (const form of verb.forms || []) {
        putEntry(form, { lemma: lower });
      }
      if (warmLemmas.length < 3000 && lower.length >= 3) {
        warmLemmas.push(lower);
      }
      continue;
    }

    // Прилагательные
    const adj = adjs.get(lower);
    if (adj && !processedLemmas.has(lower)) {
      processedLemmas.add(lower);
      const tr = resolveGermanTr(lower);
      putEntry(lower, {
        pos: 'adj',
        ...(adj.comp ? { comp: adj.comp } : {}),
        ...(adj.sup ? { sup: adj.sup } : {}),
        ...(adj.ipa ? { ipa: adj.ipa } : {}),
        ...(tr ? { tr } : {}),
      });
      for (const form of adj.forms || []) {
        putEntry(form, { lemma: lower });
      }
      if (warmLemmas.length < 3000 && lower.length >= 3) {
        warmLemmas.push(lower);
      }
      continue;
    }

    // Общее слово
    const ipa = ipaMap.get(cleanWord);
    const tr = resolveGermanTr(cleanWord);
    if ((ipa || tr) && !processedLemmas.has(cleanWord)) {
      processedLemmas.add(cleanWord);
      putEntry(cleanWord, { pos: 'other', ...(ipa ? { ipa } : {}), ...(tr ? { tr } : {}) });
    }
  }

  // 2. Дозаполняем частые глаголы
  for (const [lemma, verb] of verbs) {
    if (processedLemmas.size >= 35000) break;
    if (!processedLemmas.has(lemma)) {
      processedLemmas.add(lemma);
      const tr = resolveGermanTr(lemma);
      putEntry(lemma, {
        pos: 'v',
        ...(verb.p3 ? { p3: verb.p3 } : {}),
        ...(verb.prt ? { prt: verb.prt } : {}),
        ...(verb.p2 ? { p2: verb.p2 } : {}),
        ...(verb.aux ? { aux: verb.aux } : {}),
        ...(verb.ipa ? { ipa: verb.ipa } : {}),
        ...(tr ? { tr } : {}),
      });
      for (const form of verb.forms || []) {
        putEntry(form, { lemma });
      }
      if (warmLemmas.length < 3000) warmLemmas.push(lemma);
    }
  }

  // 3. Записываем файлы шардов public/lex/de/<xx>.json
  let totalBytes = 0;
  let totalEntries = 0;
  for (const [prefix, entriesMap] of chunks) {
    const content = JSON.stringify(entriesMap);
    const byteLength = Buffer.byteLength(content, 'utf8');
    totalBytes += byteLength;
    totalEntries += Object.keys(entriesMap).length;
    writeFileSync(path.join(outDir, `${prefix}.json`), content, 'utf8');
  }

  console.log(`[lexicon] [de] Записано ${chunks.size} файлов, ${totalEntries} записей, общим размером ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  // 4. Записываем meta.json
  const meta = {
    version: '1.1.0',
    lang: 'de',
    date: new Date().toISOString().slice(0, 10),
    entries: totalEntries,
    sources: [
      { name: 'german-nouns', url: 'https://github.com/gambolputty/german-nouns', license: 'CC BY-SA 4.0' },
      { name: 'kaikki.org (wiktextract)', url: 'https://kaikki.org/dictionary/German/', license: 'CC BY-SA 4.0' },
      { name: 'FrequencyWords', url: 'https://github.com/hermitdave/FrequencyWords', license: 'MIT' },
    ],
  };
  writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  // 5. scripts/warm-words.txt и shared/warmWords.ts
  const uniqueWarm = [...new Set(warmLemmas)].slice(0, 3000);
  const warmWordsPath = path.join(ROOT, 'scripts', 'warm-words.txt');
  const sharedWarmWordsPath = path.join(ROOT, 'shared', 'warmWords.ts');
  writeFileSync(warmWordsPath, uniqueWarm.join('\n') + '\n', 'utf8');

  const warmTs = `/**
 * Список ~3000 частых немецких слов A1-B2 для прогрева карточек ИИ (этапы 11, 14).
 * Генерируется scripts/build-lexicon.mjs из scripts/warm-words.txt.
 */
export const WARM_WORDS: string[] = ${JSON.stringify(uniqueWarm)};
`;
  writeFileSync(sharedWarmWordsPath, warmTs, 'utf8');
}
