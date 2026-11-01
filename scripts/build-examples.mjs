/**
 * Сборка базы примеров предложений из Tatoeba (этап 15).
 * Источник: Tatoeba (CC-BY 2.0 FR) — https://tatoeba.org / ManyThings.org
 * Пары de↔ru, en↔ru, de↔en, uk↔ru.
 * До 5 коротких предложений (<= 12 слов) с переводом на ru/de/en для каждой леммы.
 * Файлы: public/ex/<lang>/<prefix>.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lexicon');

function getPrefix(word) {
  const clean = word.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (clean.length < 2) return 'other';
  return clean.slice(0, 2);
}

async function downloadZip(name, url) {
  const dest = path.join(CACHE_DIR, name);
  if (existsSync(dest)) return dest;
  mkdirSync(CACHE_DIR, { recursive: true });
  console.log(`[examples] Скачиваем ${url} -> ${name}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`[examples] Скачано ${name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
  return dest;
}

function extractZip(zipPath, extractDir) {
  if (existsSync(extractDir)) return;
  mkdirSync(extractDir, { recursive: true });
  console.log(`[examples] Распаковываем ${path.basename(zipPath)}...`);
  if (process.platform === 'win32') {
    const cmd = `Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force`;
    spawnSync('powershell', ['-NoProfile', '-Command', cmd], { stdio: 'inherit' });
  } else {
    spawnSync('unzip', ['-q', zipPath, '-d', extractDir], { stdio: 'inherit' });
  }
}

async function parseSentenceFile(filePath, langCode) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  const pairs = [];
  const regex = /^([^\t]+)\t([^\t]+)\t.*tatoeba\.org #(\d+).*?#(\d+)/;

  for await (const line of rl) {
    if (!line) continue;
    const m = line.match(regex);
    if (!m) continue;
    const enText = m[1].trim();
    const targetText = m[2].trim();
    const enId = Number(m[3]);
    const targetId = Number(m[4]);
    pairs.push({ enText, targetText, enId, targetId, langCode });
  }
  return pairs;
}

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

async function main() {
  console.log('=== Сборка базы примеров Tatoeba (0.17.0) ===\n');

  // 1. Загрузка архивов
  const deuZip = await downloadZip('deu-eng.zip', 'https://www.manythings.org/anki/deu-eng.zip');
  const rusZip = await downloadZip('rus-eng.zip', 'https://www.manythings.org/anki/rus-eng.zip');
  const ukrZip = await downloadZip('ukr-eng.zip', 'https://www.manythings.org/anki/ukr-eng.zip');

  const deuDir = path.join(CACHE_DIR, 'deu-eng');
  const rusDir = path.join(CACHE_DIR, 'rus-eng');
  const ukrDir = path.join(CACHE_DIR, 'ukr-eng');

  extractZip(deuZip, deuDir);
  extractZip(rusZip, rusDir);
  extractZip(ukrZip, ukrDir);

  // 2. Чтение пар предложений
  console.log('\n[examples] Читаем файлы предложений...');
  const deuPairs = await parseSentenceFile(path.join(deuDir, 'deu.txt'), 'de');
  console.log(`[examples] Прочитано deu-eng: ${deuPairs.length} пар`);

  const rusPairs = await parseSentenceFile(path.join(rusDir, 'rus.txt'), 'ru');
  console.log(`[examples] Прочитано rus-eng: ${rusPairs.length} пар`);

  const ukrPairs = await parseSentenceFile(path.join(ukrDir, 'ukr.txt'), 'uk');
  console.log(`[examples] Прочитано ukr-eng: ${ukrPairs.length} пар`);

  // 3. Соединяем по enId для получения триад de <-> en <-> ru <-> uk
  console.log('\n[examples] Связываем параллельные переводы по Tatoeba ID...');
  const enMap = new Map();

  function getOrInit(enId, enText) {
    let item = enMap.get(enId);
    if (!item) {
      item = { enText, de: null, ru: null, uk: null };
      enMap.set(enId, item);
    }
    return item;
  }

  for (const p of deuPairs) {
    const item = getOrInit(p.enId, p.enText);
    if (!item.de) item.de = { id: p.targetId, text: p.targetText };
  }
  for (const p of rusPairs) {
    const item = getOrInit(p.enId, p.enText);
    if (!item.ru) item.ru = { id: p.targetId, text: p.targetText };
  }
  for (const p of ukrPairs) {
    const item = getOrInit(p.enId, p.enText);
    if (!item.uk) item.uk = { id: p.targetId, text: p.targetText };
  }

  console.log(`[examples] Всего уникальных предложений English: ${enMap.size}`);

  const deSentences = [];
  const enSentences = [];
  const ruSentences = [];

  for (const [enId, item] of enMap) {
    const trEn = {};
    if (item.de) trEn.de = item.de.text;
    if (item.ru) trEn.ru = item.ru.text;
    if (item.uk) trEn.uk = item.uk.text;

    if (Object.keys(trEn).length > 0 && wordCount(item.enText) <= 12) {
      enSentences.push({
        id: enId,
        text: item.enText,
        tr: trEn,
      });
    }

    if (item.de && wordCount(item.de.text) <= 12) {
      const trDe = { en: item.enText };
      if (item.ru) trDe.ru = item.ru.text;
      if (item.uk) trDe.uk = item.uk.text;
      deSentences.push({
        id: item.de.id,
        text: item.de.text,
        tr: trDe,
      });
    }

    if (item.ru && wordCount(item.ru.text) <= 12) {
      const trRu = { en: item.enText };
      if (item.de) trRu.de = item.de.text;
      if (item.uk) trRu.uk = item.uk.text;
      ruSentences.push({
        id: item.ru.id,
        text: item.ru.text,
        tr: trRu,
      });
    }
  }

  console.log(`[examples] Предложений <= 12 слов: de: ${deSentences.length}, en: ${enSentences.length}, ru: ${ruSentences.length}`);

  // 5. Индексируем предложения по леммам
  function buildLemmaExamples(sentences, lang) {
    console.log(`[examples] Индексируем примеры для ${lang}...`);
    const examples = new Map();

    sentences.sort((a, b) => {
      const trCountA = Object.keys(a.tr).length;
      const trCountB = Object.keys(b.tr).length;
      if (trCountB !== trCountA) return trCountB - trCountA;
      return a.text.length - b.text.length;
    });

    for (const s of sentences) {
      const rawWords = s.text.match(/\p{L}+/gu) || [];
      const seenInSentence = new Set();

      for (const raw of rawWords) {
        if (raw.length < 2) continue;
        // Для существительных немецкого сохраняем форму с большой буквы
        const key = lang === 'de' && /^[A-ZÄÖÜ]/.test(raw) ? raw : raw.toLowerCase();
        if (seenInSentence.has(key.toLowerCase())) continue;
        seenInSentence.add(key.toLowerCase());

        let list = examples.get(key);
        if (!list) {
          list = [];
          examples.set(key, list);
        }
        if (list.length < 5) {
          list.push({
            id: s.id,
            text: s.text,
            tr: s.tr,
          });
        }
      }
    }

    return examples;
  }

  const deExamples = buildLemmaExamples(deSentences, 'de');
  const enExamples = buildLemmaExamples(enSentences, 'en');
  const ruExamples = buildLemmaExamples(ruSentences, 'ru');

  // 6. Записываем нарезанные шарды public/ex/<lang>/<prefix>.json
  function saveChunks(examples, lang) {
    const outDir = path.join(ROOT, 'public', 'ex', lang);
    mkdirSync(outDir, { recursive: true });

    const chunks = new Map();

    for (const [lemma, list] of examples) {
      if (list.length === 0) continue;
      const prefix = getPrefix(lemma);
      if (!chunks.has(prefix)) chunks.set(prefix, {});
      chunks.get(prefix)[lemma] = list;
    }

    let totalFiles = 0;
    let totalBytes = 0;
    let totalLemmas = 0;

    for (const [prefix, chunkData] of chunks) {
      const content = JSON.stringify(chunkData);
      writeFileSync(path.join(outDir, `${prefix}.json`), content, 'utf8');
      totalFiles++;
      totalBytes += Buffer.byteLength(content, 'utf8');
      totalLemmas += Object.keys(chunkData).length;
    }

    const meta = {
      version: '1.0.0',
      lang,
      date: new Date().toISOString().slice(0, 10),
      lemmas: totalLemmas,
      files: totalFiles,
      source: 'Tatoeba (CC-BY 2.0 FR)',
      url: 'https://tatoeba.org/',
    };
    writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

    console.log(`[examples] [${lang}] Записано ${totalFiles} файлов, ${totalLemmas} лемм, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    return { totalFiles, totalBytes, totalLemmas };
  }

  const deStats = saveChunks(deExamples, 'de');
  const enStats = saveChunks(enExamples, 'en');
  const ruStats = saveChunks(ruExamples, 'ru');

  const totalFilesAll = deStats.totalFiles + enStats.totalFiles + ruStats.totalFiles;
  const totalMbAll = ((deStats.totalBytes + enStats.totalBytes + ruStats.totalBytes) / 1024 / 1024).toFixed(2);

  console.log(`\n=== ГОТОВО ===`);
  console.log(`Всего файлов примеров: ${totalFilesAll}`);
  console.log(`Общий размер: ${totalMbAll} MB`);
}

main().catch((err) => {
  console.error('[examples] Ошибка:', err);
  process.exit(1);
});
