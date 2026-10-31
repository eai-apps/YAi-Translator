/**
 * Сборка лексикона: объединение данных, разделение по 2-буквенным файлам,
 * сохранение warm-words.txt и метаданных.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'public', 'lex', 'de');
const WARM_WORDS_PATH = path.join(ROOT, 'scripts', 'warm-words.txt');
const SHARED_WARM_WORDS_PATH = path.join(ROOT, 'shared', 'warmWords.ts');

export function getPrefix(word) {
  const clean = word.trim().toLowerCase().replace(/[^a-zäöüß0-9]/gi, '');
  if (clean.length < 2) return 'other';
  return clean.slice(0, 2);
}

export async function buildLexiconDatabase({ frequencyList, nouns, verbs, adjs, ipaMap }) {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log('[lexicon] Формируем лексикон...');

  const chunks = new Map(); // prefix -> { [word]: entry }
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

  // 1. Проходим по частотному списку слов
  for (const word of frequencyList) {
    if (processedLemmas.size >= 32000) break;
    const cleanWord = word.trim();
    if (!cleanWord || cleanWord.length < 2) continue;

    // Ищем в существительных (обычно с заглавной)
    const cap = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    const noun = nouns.get(cap) || nouns.get(cleanWord);
    if (noun && !processedLemmas.has(cap)) {
      processedLemmas.add(cap);
      const ipa = ipaMap.get(cap) || ipaMap.get(cleanWord);
      putEntry(cap, {
        pos: 'n',
        g: noun.g,
        ...(noun.pl ? { pl: noun.pl } : {}),
        ...(noun.gen ? { gen: noun.gen } : {}),
        ...(ipa ? { ipa } : {}),
      });
      // Добавляем формы существительного со ссылкой на лемму
      for (const form of noun.forms || []) {
        putEntry(form, { lemma: cap });
      }
      if (warmLemmas.length < 3000 && cap.length >= 3 && !['Der', 'Die', 'Das', 'Ein', 'Eine', 'Ist'].includes(cap)) {
        warmLemmas.push(cap);
      }
      continue;
    }

    // Ищем в глаголах (обычно строчные)
    const lower = cleanWord.toLowerCase();
    const verb = verbs.get(lower);
    if (verb && !processedLemmas.has(lower)) {
      processedLemmas.add(lower);
      putEntry(lower, {
        pos: 'v',
        ...(verb.p3 ? { p3: verb.p3 } : {}),
        ...(verb.prt ? { prt: verb.prt } : {}),
        ...(verb.p2 ? { p2: verb.p2 } : {}),
        ...(verb.aux ? { aux: verb.aux } : {}),
        ...(verb.ipa ? { ipa: verb.ipa } : {}),
      });
      for (const form of verb.forms || []) {
        putEntry(form, { lemma: lower });
      }
      if (warmLemmas.length < 3000 && lower.length >= 3) {
        warmLemmas.push(lower);
      }
      continue;
    }

    // Ищем в прилагательных
    const adj = adjs.get(lower);
    if (adj && !processedLemmas.has(lower)) {
      processedLemmas.add(lower);
      putEntry(lower, {
        pos: 'adj',
        ...(adj.comp ? { comp: adj.comp } : {}),
        ...(adj.sup ? { sup: adj.sup } : {}),
        ...(adj.ipa ? { ipa: adj.ipa } : {}),
      });
      for (const form of adj.forms || []) {
        putEntry(form, { lemma: lower });
      }
      if (warmLemmas.length < 3000 && lower.length >= 3) {
        warmLemmas.push(lower);
      }
      continue;
    }

    // Если есть IPA, добавляем как общее слово
    const ipa = ipaMap.get(cleanWord);
    if (ipa && !processedLemmas.has(cleanWord)) {
      processedLemmas.add(cleanWord);
      putEntry(cleanWord, { pos: 'other', ipa });
    }
  }

  // 2. Дозаполняем частые глаголы и существительные, если в частотном списке их не хватило
  for (const [lemma, verb] of verbs) {
    if (processedLemmas.size >= 35000) break;
    if (!processedLemmas.has(lemma)) {
      processedLemmas.add(lemma);
      putEntry(lemma, {
        pos: 'v',
        ...(verb.p3 ? { p3: verb.p3 } : {}),
        ...(verb.prt ? { prt: verb.prt } : {}),
        ...(verb.p2 ? { p2: verb.p2 } : {}),
        ...(verb.aux ? { aux: verb.aux } : {}),
        ...(verb.ipa ? { ipa: verb.ipa } : {}),
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
  for (const [prefix, entries] of chunks) {
    const content = JSON.stringify(entries);
    const byteLength = Buffer.byteLength(content, 'utf8');
    totalBytes += byteLength;
    totalEntries += Object.keys(entries).length;
    writeFileSync(path.join(OUT_DIR, `${prefix}.json`), content, 'utf8');
  }

  console.log(`[lexicon] Записано ${chunks.size} файлов, ${totalEntries} записей, общим размером ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  // 4. Записываем public/lex/de/meta.json
  const meta = {
    version: '1.0.0',
    lang: 'de',
    date: new Date().toISOString().slice(0, 10),
    entries: totalEntries,
    sources: [
      { name: 'german-nouns', url: 'https://github.com/gambolputty/german-nouns', license: 'CC BY-SA 4.0' },
      { name: 'kaikki.org (wiktextract)', url: 'https://kaikki.org/dictionary/German/', license: 'CC BY-SA 4.0' },
      { name: 'FrequencyWords', url: 'https://github.com/hermitdave/FrequencyWords', license: 'MIT' },
    ],
  };
  writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  // 5. Записываем scripts/warm-words.txt и shared/warmWords.ts
  const uniqueWarm = [...new Set(warmLemmas)].slice(0, 3000);
  writeFileSync(WARM_WORDS_PATH, uniqueWarm.join('\n') + '\n', 'utf8');
  console.log(`[lexicon] Записано ${uniqueWarm.length} слов в ${WARM_WORDS_PATH}`);

  const warmTs = `/**
 * Список ~3000 частых немецких слов A1-B2 для прогрева карточек ИИ (этап 11).
 * Генерируется scripts/build-lexicon.mjs из scripts/warm-words.txt.
 */
export const WARM_WORDS: string[] = ${JSON.stringify(uniqueWarm)};
`;
  writeFileSync(SHARED_WARM_WORDS_PATH, warmTs, 'utf8');
  console.log(`[lexicon] Записано ${SHARED_WARM_WORDS_PATH}`);
}
