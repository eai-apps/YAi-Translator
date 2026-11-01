/**
 * Генерация списка топ-5000 немецких и топ-3000 английских слов для прогрева (этап 15Б).
 * Читает открытые частотные списки HermitDave / FrequencyWords.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lexicon');

function loadTopWords(filename, limit) {
  const filePath = path.join(CACHE_DIR, filename);
  if (!existsSync(filePath)) {
    console.error(`Файл ${filePath} не найден!`);
    process.exit(1);
  }
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const words = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    const word = parts[0];
    if (!word || word.length < 2) continue;
    // Пропускаем цифры и пунктуацию
    if (!/^[\p{L}\p{M}'-]+$/u.test(word)) continue;
    const lower = word.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    words.push(word);
    if (words.length >= limit) break;
  }
  return words;
}

const deWords = loadTopWords('de_50k.txt', 5000);
const enWords = loadTopWords('en_50k.txt', 3000);

console.log(`Загружено: DE = ${deWords.length}, EN = ${enWords.length}`);

const code = `/**
 * Список топ-5000 немецких и топ-3000 английских слов для прогрева карточек (этап 15Б, версия 0.17.5).
 * Сгенерировано scripts/build-warm-words.mjs из FrequencyWords (HermitDave).
 */

export interface WarmWordEntry {
  lemma: string;
  lang: 'de' | 'en';
  explainLang: 'ru' | 'de' | 'en' | 'uk';
}

export const WARM_DE_WORDS: string[] = ${JSON.stringify(deWords)};

export const WARM_EN_WORDS: string[] = ${JSON.stringify(enWords)};

/** Языки объяснения для каждого изучаемого языка */
export const WARM_EXPLAIN_LANGS: Record<'de' | 'en', Array<'ru' | 'de' | 'en' | 'uk'>> = {
  de: ['ru', 'en', 'uk'],
  en: ['ru', 'de', 'uk'],
};

/** Общее количество задач прогрева (слов × языков объяснения) */
export const TOTAL_WARM_TASKS =
  WARM_DE_WORDS.length * WARM_EXPLAIN_LANGS.de.length +
  WARM_EN_WORDS.length * WARM_EXPLAIN_LANGS.en.length;

/** Получение задачи прогрева по линейному курсору */
export function getWarmTaskAt(index: number): WarmWordEntry {
  const deTotal = WARM_DE_WORDS.length * WARM_EXPLAIN_LANGS.de.length;
  const safeIndex = ((index % TOTAL_WARM_TASKS) + TOTAL_WARM_TASKS) % TOTAL_WARM_TASKS;

  if (safeIndex < deTotal) {
    const wordIdx = Math.floor(safeIndex / WARM_EXPLAIN_LANGS.de.length);
    const langIdx = safeIndex % WARM_EXPLAIN_LANGS.de.length;
    return {
      lemma: WARM_DE_WORDS[wordIdx],
      lang: 'de',
      explainLang: WARM_EXPLAIN_LANGS.de[langIdx],
    };
  }

  const enIndex = safeIndex - deTotal;
  const wordIdx = Math.floor(enIndex / WARM_EXPLAIN_LANGS.en.length);
  const langIdx = enIndex % WARM_EXPLAIN_LANGS.en.length;
  return {
    lemma: WARM_EN_WORDS[wordIdx],
    lang: 'en',
    explainLang: WARM_EXPLAIN_LANGS.en[langIdx],
  };
}

/** Совместимость с кодом этапа 11 */
export const WARM_WORDS: string[] = WARM_DE_WORDS;
`;

const targetPath = path.join(ROOT, 'shared', 'warmWords.ts');
writeFileSync(targetPath, code, 'utf-8');
console.log(`Файл ${targetPath} успешно записан! Общий объём задач: ${deWords.length * 3 + enWords.length * 3}`);
