/**
 * Сборка собственной базы немецких слов (этап 11).
 * Запуск: node scripts/build-lexicon.mjs
 *
 * 1. Скачивает и кэширует:
 *    - FrequencyWords (de_50k.txt)
 *    - gambolputty/german-nouns (nouns.csv)
 *    - kaikki.org (kaikki.org-dictionary-German.jsonl)
 * 2. Парсит и связывает леммы, формы, артикли, IPA, склонения/спряжения.
 * 3. Раскладывает в public/lex/de/<xx>.json (<= 1MB каждый, суммарно <= 25MB).
 * 4. Создаёт public/lex/de/meta.json, scripts/warm-words.txt и shared/warmWords.ts.
 */
import { ensureFile } from './lexicon/fetchers.mjs';
import { parseFrequency, parseNounsCsv } from './lexicon/parser.mjs';
import { parseKaikki } from './lexicon/kaikki-parser.mjs';
import { buildLexiconDatabase } from './lexicon/generator.mjs';

async function main() {
  console.log('=== Сборка лексикона немецкого языка YAi Translator ===');

  // 1. Загрузка исходников
  const freqPath = await ensureFile('freq');
  const nounsPath = await ensureFile('nouns');
  const kaikkiPath = await ensureFile('kaikki');

  // 2. Парсинг частотного списка и существительных
  console.log('[lexicon] Читаем частотный список...');
  const { list: frequencyList } = await parseFrequency(freqPath, 45000);

  console.log('[lexicon] Читаем базу существительных...');
  const nouns = await parseNounsCsv(nounsPath);

  // 3. Парсинг Wiktionary Kaikki (глаголы, прилагательные, IPA)
  console.log('[lexicon] Читаем выгрузку Kaikki Wiktionary (это может занять около 30 секунд)...');
  const { verbs, adjs, ipaMap } = await parseKaikki(kaikkiPath);

  // 4. Генерация лексикона и вспомогательных файлов
  await buildLexiconDatabase({
    frequencyList,
    nouns,
    verbs,
    adjs,
    ipaMap,
  });

  console.log('=== Сборка лексикона успешно завершена! ===');
}

main().catch((err) => {
  console.error('[lexicon] Ошибка сборки лексикона:', err);
  process.exit(1);
});
