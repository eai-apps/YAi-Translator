/**
 * Сборка собственной базы слов для YAi Translator (этап 11, этап 14).
 * Запуск:
 *   npm run lexicon -- --lang en
 *   npm run lexicon -- --lang de
 *   npm run lexicon -- --lang all
 */
import { ensureFile, ensureFrequencyFile, ensureKaikkiFile, LANGUAGE_KAIKKI_NAMES } from './lexicon/fetchers.mjs';
import { parseFrequency, parseNounsCsv } from './lexicon/parser.mjs';
import { parseKaikki, parseKaikkiUniversal } from './lexicon/kaikki-parser.mjs';
import { buildLexiconDatabase, buildLanguageLexiconDatabase } from './lexicon/generator.mjs';

function parseCliArgs() {
  const args = process.argv.slice(2);
  let lang = 'en'; // По умолчанию для этапа 14

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang' && args[i + 1]) {
      lang = args[i + 1].toLowerCase();
      i++;
    } else if (args[i].startsWith('--lang=')) {
      lang = args[i].split('=')[1].toLowerCase();
    }
  }
  return { lang };
}

async function buildEnglish() {
  console.log('--- [1/2] Сборка английского словаря (en) ---');
  const freqPath = await ensureFrequencyFile('en');
  const { list: frequencyList } = await parseFrequency(freqPath, 50000);

  const kaikkiPath = await ensureKaikkiFile('en');
  console.log('[lexicon] Читаем выгрузку Kaikki English (может занять 1-2 минуты)...');
  const freqSet = new Set(frequencyList.map((w) => w.toLowerCase()));
  const { entries, formToLemma } = await parseKaikkiUniversal(kaikkiPath, 'en', {
    frequencySet: freqSet,
    maxLemmas: 60000,
  });

  await buildLanguageLexiconDatabase({
    lang: 'en',
    entries,
    formToLemma,
    frequencyList,
  });
  console.log('--- Английский словарь успешно собран! ---');
}

async function buildGerman() {
  console.log('--- [2/2] Сборка немецкого словаря (de) ---');
  const freqPath = await ensureFile('freq');
  const nounsPath = await ensureFile('nouns');
  const kaikkiPath = await ensureFile('kaikki');

  console.log('[lexicon] Читаем частотный список de...');
  const { list: frequencyList } = await parseFrequency(freqPath, 45000);

  console.log('[lexicon] Читаем базу существительных de...');
  const nouns = await parseNounsCsv(nounsPath);

  console.log('[lexicon] Читаем выгрузку Kaikki German...');
  const { verbs, adjs, ipaMap, translationsMap } = await parseKaikki(kaikkiPath);

  await buildLexiconDatabase({
    frequencyList,
    nouns,
    verbs,
    adjs,
    ipaMap,
    translationsMap,
  });
  console.log('--- Немецкий словарь успешно собран! ---');
}

async function buildSingleLanguage(lang) {
  if (lang === 'de') return buildGerman();
  if (lang === 'en') return buildEnglish();

  const name = LANGUAGE_KAIKKI_NAMES[lang];
  if (!name) throw new Error(`Неизвестный язык: ${lang}`);

  console.log(`--- Сборка словаря для ${lang} (${name}) ---`);
  let frequencyList = [];
  try {
    const freqPath = await ensureFrequencyFile(lang);
    const parsed = await parseFrequency(freqPath, 30000);
    frequencyList = parsed.list;
  } catch {
    console.log(`[lexicon] Частотный список для ${lang} пропущен.`);
  }

  const kaikkiPath = await ensureKaikkiFile(lang);
  const freqSet = new Set(frequencyList.map((w) => w.toLowerCase()));
  const { entries, formToLemma } = await parseKaikkiUniversal(kaikkiPath, lang, {
    frequencySet: freqSet,
    maxLemmas: 25000,
  });

  await buildLanguageLexiconDatabase({
    lang,
    entries,
    formToLemma,
    frequencyList,
  });
  console.log(`--- Словарь для ${lang} успешно собран! ---`);
}

async function main() {
  const { lang } = parseCliArgs();
  console.log(`=== Сборка лексикона YAi Translator (режим: ${lang}) ===`);

  if (lang === 'all') {
    const allLangs = ['en', 'de'];
    for (const l of allLangs) {
      await buildSingleLanguage(l);
    }
  } else {
    await buildSingleLanguage(lang);
  }

  console.log('=== Все операции успешно завершены! ===');
}

main().catch((err) => {
  console.error('[lexicon] Ошибка сборки:', err);
  process.exit(1);
});
