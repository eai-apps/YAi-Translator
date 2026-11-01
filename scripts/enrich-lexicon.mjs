/**
 * Обогащение базы лексикона (этап 15):
 * 1. Частота слова (FrequencyWords) -> fr (ранг 1..50000) для примерного уровня A1..B2..C1+
 * 2. Произношение человека (Wikimedia Commons / Lingua Libre) -> audio (mp3 ссылка)
 * 3. Синонимы (Wiktionary / OpenThesaurus / WordNet) -> syn (до 6 синонимов)
 * 4. Немецкие глаголы: сильные/неправильные формы (Präsens, Präteritum, Partizip II, haben/sein)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lexicon');

async function loadFrequency(filePath) {
  const ranks = new Map();
  if (!existsSync(filePath)) return ranks;
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  let rank = 1;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    const word = parts[0]?.toLowerCase();
    if (word && !ranks.has(word)) {
      ranks.set(word, rank);
      rank++;
    }
  }
  return ranks;
}

async function extractKaikkiEnrichment(kaikkiPath, isGerman = false) {
  console.log(`[enrich] Сканируем ${path.basename(kaikkiPath)} на аудио, синонимы и формы...`);
  const audioMap = new Map();
  const synMap = new Map();
  const verbMap = new Map();

  if (!existsSync(kaikkiPath)) {
    console.warn(`[enrich] Файл ${kaikkiPath} не найден, пропускаем.`);
    return { audioMap, synMap, verbMap };
  }

  const rl = createInterface({ input: createReadStream(kaikkiPath), crlfDelay: Infinity });
  let lineCount = 0;

  for await (const line of rl) {
    if (!line) continue;
    lineCount++;
    try {
      const d = JSON.parse(line);
      const word = d.word?.trim();
      if (!word || word.length < 2) continue;

      // 1. Аудио (mp3_url с upload.wikimedia.org)
      if (!audioMap.has(word) && d.sounds) {
        for (const s of d.sounds) {
          if (s.mp3_url && s.mp3_url.includes('upload.wikimedia.org')) {
            audioMap.set(word, s.mp3_url);
            break;
          }
        }
      }

      // 2. Синонимы
      let synList = synMap.get(word);
      if (!synList) {
        synList = [];
        synMap.set(word, synList);
      }
      if (synList.length < 6 && d.synonyms) {
        for (const s of d.synonyms) {
          const sw = s.word?.trim();
          if (sw && sw.length >= 2 && !sw.includes(' ') && sw !== word && !synList.includes(sw)) {
            synList.push(sw);
            if (synList.length >= 6) break;
          }
        }
      }
      if (synList.length < 6 && d.senses) {
        for (const sense of d.senses) {
          if (sense.synonyms) {
            for (const s of sense.synonyms) {
              const sw = s.word?.trim();
              if (sw && sw.length >= 2 && !sw.includes(' ') && sw !== word && !synList.includes(sw)) {
                synList.push(sw);
                if (synList.length >= 6) break;
              }
            }
          }
          if (synList.length >= 6) break;
        }
      }

      // 3. Формы немецких глаголов (Präsens 3 л., Präteritum, Partizip II, haben/sein)
      if (isGerman && d.pos === 'verb' && !verbMap.has(word)) {
        let p3, prt, p2, aux;
        for (const f of d.forms || []) {
          const val = f.form?.trim();
          if (!val || val.includes(' ') || val === word) continue;
          const tags = f.tags || [];
          if (!p3 && tags.includes('present') && tags.includes('singular') && (tags.includes('third-person') || tags.includes('singular-third-person'))) {
            p3 = val;
          }
          if (!prt && (tags.includes('past') || tags.includes('preterite')) && tags.includes('singular') && tags.includes('third-person')) {
            prt = val;
          }
          if (!p2 && tags.includes('participle') && tags.includes('past')) {
            p2 = val;
          }
          if (!aux && tags.includes('auxiliary')) {
            if (val === 'haben' || val === 'sein') aux = val;
          }
        }
        if (p3 || prt || p2 || aux) {
          verbMap.set(word, {
            ...(p3 ? { p3 } : {}),
            ...(prt ? { prt } : {}),
            ...(p2 ? { p2 } : {}),
            aux: aux || 'haben',
          });
        }
      }
    } catch {
      // Игнорируем битые строки
    }
  }

  console.log(`[enrich] Извлечено: аудио: ${audioMap.size}, синонимов: ${synMap.size}, глаголов: ${verbMap.size}`);
  return { audioMap, synMap, verbMap };
}

async function enrichLanguage(lang) {
  console.log(`\n=== Обогащение лексикона для [${lang}] ===`);
  const lexDir = path.join(ROOT, 'public', 'lex', lang);
  if (!existsSync(lexDir)) {
    console.error(`Директория ${lexDir} не существует!`);
    return;
  }

  // 1. Частотный список
  const freqPath = path.join(CACHE_DIR, `${lang}_50k.txt`);
  const ranks = await loadFrequency(freqPath);
  console.log(`[enrich] Загружено рангов частоты: ${ranks.size}`);

  // 2. Kaikki данные
  const kaikkiPath = lang === 'de'
    ? path.join(CACHE_DIR, 'kaikki.jsonl')
    : path.join(CACHE_DIR, `kaikki-${lang}.jsonl`);
  const { audioMap, synMap, verbMap } = await extractKaikkiEnrichment(kaikkiPath, lang === 'de');

  // 3. Обходим все chunk файлы в public/lex/<lang>/
  const files = readdirSync(lexDir).filter((f) => f.endsWith('.json') && f !== 'meta.json');
  let enrichedCount = 0;
  let audioCount = 0;
  let synCount = 0;
  let verbCount = 0;

  for (const file of files) {
    const filePath = path.join(lexDir, file);
    const chunk = JSON.parse(readFileSync(filePath, 'utf8'));
    let changed = false;

    for (const [key, entry] of Object.entries(chunk)) {
      if (!entry || typeof entry !== 'object' || 'lemma' in entry) continue; // Пропускаем референсы

      const lower = key.toLowerCase();

      // Ранг частоты
      const rank = ranks.get(lower) || ranks.get(key);
      if (rank && entry.fr !== rank) {
        entry.fr = rank;
        changed = true;
      }

      // Аудио
      if (!entry.audio) {
        const audio = audioMap.get(key) || audioMap.get(lower);
        if (audio) {
          entry.audio = audio;
          audioCount++;
          changed = true;
        }
      }

      // Синонимы
      if (!entry.syn || entry.syn.length === 0) {
        const syns = synMap.get(key) || synMap.get(lower);
        if (syns && syns.length > 0) {
          entry.syn = syns.slice(0, 6);
          synCount++;
          changed = true;
        }
      }

      // Глагольные формы немецкого
      if (lang === 'de' && entry.pos === 'v') {
        const vForms = verbMap.get(key) || verbMap.get(lower);
        if (vForms) {
          if (!entry.p3 && vForms.p3) { entry.p3 = vForms.p3; changed = true; }
          if (!entry.prt && vForms.prt) { entry.prt = vForms.prt; changed = true; }
          if (!entry.p2 && vForms.p2) { entry.p2 = vForms.p2; changed = true; }
          if (!entry.aux && vForms.aux) { entry.aux = vForms.aux; changed = true; }
          verbCount++;
        }
      }

      enrichedCount++;
    }

    if (changed) {
      writeFileSync(filePath, JSON.stringify(chunk), 'utf8');
    }
  }

  // 4. Обновляем meta.json
  const metaPath = path.join(lexDir, 'meta.json');
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    meta.sources = [
      { name: 'Wiktionary / Kaikki.org', url: `https://kaikki.org/dictionary/${lang}/`, license: 'CC BY-SA 4.0' },
      { name: 'FrequencyWords', url: 'https://github.com/hermitdave/FrequencyWords', license: 'MIT' },
      { name: 'Wikimedia Commons / Lingua Libre', url: 'https://commons.wikimedia.org/', license: 'CC BY-SA 4.0' },
    ];
    writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  }

  console.log(`[enrich] [${lang}] Завершено! Обогащено лемм: ${enrichedCount}, добавлено аудио: ${audioCount}, синонимов: ${synCount}, глагольных форм: ${verbCount}`);
}

async function main() {
  await enrichLanguage('de');
  await enrichLanguage('en');
  console.log('\n=== ВСЕ ЯЗЫКИ ОБОГАЩЕНЫ ===');
}

main().catch((err) => {
  console.error('[enrich] Ошибка:', err);
  process.exit(1);
});
