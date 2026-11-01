/**
 * Сборщик готовых наборов слов (shared/decks/):
 * Генерирует тематические наборы A1–B1 для немецкого и английского языков,
 * а также наборы «Топ-500 слов» из базы лексикона и Tatoeba.
 *
 * Запуск: npm run decks
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TOPICS_FILE = path.join(ROOT, 'scripts', 'decks', 'topics.json');
const DECKS_DIR = path.join(ROOT, 'shared', 'decks');

const lexCache = new Map();
const exCache = new Map();

function getPrefix(word) {
  const clean = word.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (clean.length < 2) return 'other';
  return clean.slice(0, 2);
}

function loadLex(lang, prefix) {
  const key = `${lang}:${prefix}`;
  if (lexCache.has(key)) return lexCache.get(key);
  const file = path.join(ROOT, 'public', 'lex', lang, `${prefix}.json`);
  let data = null;
  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (_e) {}
  }
  lexCache.set(key, data);
  return data;
}

function loadEx(lang, prefix) {
  const key = `${lang}:${prefix}`;
  if (exCache.has(key)) return exCache.get(key);
  const file = path.join(ROOT, 'public', 'ex', lang, `${prefix}.json`);
  let data = null;
  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (_e) {}
  }
  exCache.set(key, data);
  return data;
}

// Загрузка переводов commonTranslationsDeRu
let commonDeRu = {};
try {
  const comFile = path.join(ROOT, 'src', 'data', 'commonTranslationsDeRu.ts');
  const content = fs.readFileSync(comFile, 'utf8');
  const matches = content.matchAll(/^\s*([A-Za-zÄÖÜäöüß]+)\s*:\s*['"]([^'"]+)['"]/gm);
  for (const m of matches) {
    commonDeRu[m[1].toLowerCase()] = m[2];
  }
} catch (_e) {}

// Собственные переводы бытовых терминов: не подменяем отсутствующий перевод исходным словом.
const curated = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/decks/curated.json'), 'utf8'));
for (const [lemma, translation] of Object.entries(curated)) commonDeRu[lemma.toLowerCase()] = translation;

function resolveLexEntry(lang, word) {
  const prefix = getPrefix(word);
  const chunk = loadLex(lang, prefix);
  if (!chunk) return null;

  let entry = chunk[word] || chunk[word.toLowerCase()] || chunk[word.charAt(0).toUpperCase() + word.slice(1)];
  if (!entry) return null;

  if (entry.lemma && !entry.pos) {
    const rootPrefix = getPrefix(entry.lemma);
    const rootChunk = loadLex(lang, rootPrefix);
    if (rootChunk && rootChunk[entry.lemma]) {
      entry = { ...rootChunk[entry.lemma], formsLemma: entry.lemma };
    }
  }
  return entry;
}

function resolveExample(lang, lemma) {
  const prefix = getPrefix(lemma);
  const chunk = loadEx(lang, prefix);
  if (!chunk) return null;

  const list = chunk[lemma] || chunk[lemma.toLowerCase()] || chunk[lemma.charAt(0).toUpperCase() + lemma.slice(1)];
  if (!Array.isArray(list) || list.length === 0) return null;

  // Ищем короткий пример с переводом на русский
  for (const item of list) {
    if (!item.text || !item.tr) continue;
    const words = item.text.trim().split(/\s+/).length;
    if (words <= 12 && (item.tr.ru || item.tr.uk || item.tr.en)) {
      return {
        text: item.text,
        translation: item.tr.ru || item.tr.uk || item.tr.en || item.tr.de,
      };
    }
  }
  return null;
}

function mapPos(pos) {
  if (pos === 'n') return 'noun';
  if (pos === 'v') return 'verb';
  if (pos === 'adj') return 'adjective';
  if (pos === 'adv') return 'adverb';
  return 'other';
}

function resolveArticle(lang, entry) {
  if (lang !== 'de') return null;
  if (!entry || entry.pos !== 'n') return null;
  if (entry.g === 'der' || entry.g === 'die' || entry.g === 'das') return entry.g;
  if (entry.g === 'm') return 'der';
  if (entry.g === 'f') return 'die';
  if (entry.g === 'n') return 'das';
  return null;
}

function resolveTranslations(lang, lemma, entry) {
  if (lang === 'en') {
    const ruList = entry?.tr?.ru || [];
    const ukList = entry?.tr?.uk || [];
    const deList = entry?.tr?.de || [];
    return {
      ru: ruList[0] || lemma,
      uk: ukList[0] || ruList[0] || lemma,
      en: lemma,
      de: deList[0] || undefined,
    };
  }

  // Немецкий
  const ruTr = commonDeRu[lemma.toLowerCase()] || (entry?.tr?.ru ? entry.tr.ru[0] : null) || lemma;
  const ukTr = (entry?.tr?.uk ? entry.tr.uk[0] : null) || ruTr;
  const enTr = (entry?.tr?.en ? entry.tr.en[0] : null) || lemma;
  return {
    ru: ruTr,
    uk: ukTr,
    en: enTr,
  };
}

function makeDeckWord(lang, lemma) {
  const entry = resolveLexEntry(lang, lemma);
  const pos = mapPos(entry?.pos);
  const article = resolveArticle(lang, entry);
  const plural = entry?.pl || null;
  const translations = resolveTranslations(lang, lemma, entry);
  let example = resolveExample(lang, lemma);
  if (!example) {
    example = null;
  }

  return {
    lemma: entry?.formsLemma || lemma,
    article,
    plural,
    partOfSpeech: pos,
    translations,
    example,
    lang,
  };
}

function generateThematicDeck(deckMeta, lang) {
  const seen = new Set();
  const words = [];

  for (const rawLemma of deckMeta.lemmas) {
    const clean = rawLemma.trim();
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const word = makeDeckWord(lang, clean);
    if (word.translations.ru && word.translations.ru.toLowerCase() !== word.lemma.toLowerCase()) words.push(word);
  }

  return {
    id: deckMeta.id,
    level: deckMeta.level,
    lang,
    titleKey: deckMeta.titleKey,
    words,
  };
}

function generateTop500(lang) {
  console.log(`Сканирование лексикона ${lang} для топ-500...`);
  const lexDir = path.join(ROOT, 'public', 'lex', lang);
  const files = fs.readdirSync(lexDir).filter((f) => f.endsWith('.json'));

  const candidates = [];
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(lexDir, file), 'utf8'));
      for (const [key, val] of Object.entries(content)) {
        if (!val || typeof val !== 'object') continue;
        if (val.lemma && !val.pos) continue; // ссылка на лемму
        if (!val.fr || val.fr <= 0 || val.fr > 3000) continue; // частые слова
        if (!['n', 'v', 'adj', 'adv'].includes(val.pos)) continue;

        candidates.push({ lemma: key, fr: val.fr, entry: val });
      }
    } catch (_e) {}
  }

  candidates.sort((a, b) => a.fr - b.fr);

  const seen = new Set();
  const topWords = [];
  for (const c of candidates) {
    const k = c.lemma.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);

    const w = makeDeckWord(lang, c.lemma);
    // Проверяем наличие осмысленного перевода
    if (w.translations.ru && w.translations.ru !== w.lemma) {
      topWords.push(w);
    }
    if (topWords.length >= 500) break;
  }

  console.log(`Топ-500 для ${lang}: найдено ${topWords.length} слов.`);
  return {
    id: `${lang}-top500`,
    level: 'A1',
    lang,
    titleKey: lang === 'de' ? 'study.deckDeTop500' : 'study.deckEnTop500',
    words: topWords,
  };
}

function writeDeckTs(deck) {
  const varName = deck.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const code = `/** Набор «${deck.id}» (уровень ${deck.level}, язык ${deck.lang}). Автоматическая сборка. */
import type { StudyDeck } from '../study';

export const ${varName}: StudyDeck = ${JSON.stringify(deck, null, 2)};
`;
  const targetFile = path.join(DECKS_DIR, `${deck.id}.ts`);
  fs.writeFileSync(targetFile, code, 'utf8');
}

function main() {
  console.log('Запуск генератора наборов слов...');
  const topics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));

  const allDecks = [];

  // Немецкие наборы
  for (const meta of topics.de) {
    console.log(`Генерация набора: de / ${meta.id} (${meta.lemmas.length} слов)...`);
    const deck = generateThematicDeck(meta, 'de');
    writeDeckTs(deck);
    allDecks.push(deck);
  }

  // Немецкий топ-500
  const deTop500 = generateTop500('de');
  writeDeckTs(deTop500);
  allDecks.push(deTop500);

  // Английские наборы
  for (const meta of topics.en) {
    console.log(`Генерация набора: en / ${meta.id} (${meta.lemmas.length} слов)...`);
    const deck = generateThematicDeck(meta, 'en');
    writeDeckTs(deck);
    allDecks.push(deck);
  }

  // Английский топ-500
  const enTop500 = generateTop500('en');
  writeDeckTs(enTop500);
  allDecks.push(enTop500);

  // Генерация shared/decks/index.ts
  console.log('Обновление shared/decks/index.ts...');
  const imports = allDecks
    .map((d) => {
      const varName = d.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      return `import { ${varName} } from './${d.id}';`;
    })
    .join('\n');

  const deckList = allDecks
    .map((d) => `  ${d.id.toUpperCase().replace(/[^A-Z0-9]/g, '_')},`)
    .join('\n');

  const indexCode = `/**
 * Готовые наборы слов (этап 6, часть 16): немецкие и английские темы + топ-500.
 * Слово дня выбирается из этого же списка (A1-A2 de с примером).
 */
import type { DeckWord, StudyDeck, WordOfDayResponse } from '../study';
import { hashCode } from '../study';

${imports}

/** Все доступные готовые наборы (немецкие и английские темы A1–B1 и топ-500). */
export const STUDY_DECKS: StudyDeck[] = [
${deckList}
];

/**
 * Слова для «Слова дня»: отбираются стабильные немецкие слова A1–A2 с примером.
 */
export const DECK_WORDS: Array<{ deck: StudyDeck; word: DeckWord }> = STUDY_DECKS
  .filter((d) => (!d.lang || d.lang === 'de') && d.id !== 'de-top500' && (d.level === 'A1' || d.level === 'A2'))
  .flatMap((deck) =>
    deck.words
      .filter((w) => Boolean(w.example?.text && w.example?.translation))
      .map((word) => ({ deck, word })),
  );

/**
 * Слово дня: одинаковый день — одинаковое слово у всех.
 * Хеш от даты (UTC) даёт стабильный номер, без случайности.
 */
export function wordOfDay(dateKey: string): WordOfDayResponse {
  const index = Math.abs(hashCode(dateKey)) % DECK_WORDS.length;
  const entry = DECK_WORDS[index];
  return {
    date: dateKey,
    deckId: entry.deck.id,
    deckTitleKey: entry.deck.titleKey,
    word: entry.word,
    level: entry.deck.level,
  };
}

/** Набор по id — нужен экранам и карточкам. */
export function findDeck(id: string): StudyDeck | undefined {
  return STUDY_DECKS.find((deck) => deck.id === id);
}
`;

  fs.writeFileSync(path.join(DECKS_DIR, 'index.ts'), indexCode, 'utf8');
  const compact = {};
  for (const deck of allDecks.filter(d => d.lang === 'de')) {
    for (const word of deck.words) if (word.translations.ru && word.translations.ru !== word.lemma) compact[word.lemma] = word.translations.ru;
  }
  fs.writeFileSync(path.join(ROOT, 'src/data/deckTranslationsDeRu.ts'), '/** Компактные переводы наборов. */\nexport const DECK_TRANSLATIONS_DE_RU: Record<string, string> = ' + JSON.stringify(compact, null, 2) + ';\n');
  console.log(`Готово! Всего наборов: ${allDecks.length}`);
}

main();
