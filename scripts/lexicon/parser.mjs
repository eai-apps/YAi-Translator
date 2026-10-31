/**
 * Парсер исходных данных: частотного списка, существительных (CSV) и Wiktionary (JSONL).
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const GENDER_MAP = { m: 'der', f: 'die', n: 'das' };

/** Читает список частых слов: word -> rank (от 1). */
export async function parseFrequency(filePath, maxWords = 40000) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  const rankMap = new Map();
  const list = [];
  let rank = 1;
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const word = parts[0];
    if (!word || /^\d+$/.test(word)) continue;
    if (!rankMap.has(word)) {
      rankMap.set(word, rank);
      list.push(word);
      rank++;
      if (rank > maxWords) break;
    }
  }
  return { rankMap, list };
}

/** Парсит CSV существительных gambolputty/german-nouns. */
export async function parseNounsCsv(filePath) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  const nouns = new Map(); // lemma -> { g, pl, gen, forms: Set }
  let header = null;
  let idxLemma = 0, idxGenus = 2, idxNomPl = 16, idxGenSg = 25;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    if (!header) {
      header = cols;
      idxLemma = header.indexOf('lemma');
      idxGenus = header.indexOf('genus');
      idxNomPl = header.indexOf('nominativ plural');
      idxGenSg = header.indexOf('genitiv singular');
      continue;
    }
    const lemma = cols[idxLemma]?.trim();
    const rawGenus = cols[idxGenus]?.trim();
    const g = GENDER_MAP[rawGenus];
    if (!lemma || !g) continue;

    const pl = (cols[idxNomPl] || cols[idxNomPl + 2] || '').trim();
    const gen = (cols[idxGenSg] || cols[idxGenSg + 2] || '').trim();

    const forms = new Set();
    // Собираем все словоформы существительного (падежи и числа)
    for (let i = 7; i < cols.length - 1; i++) {
      const f = cols[i]?.trim();
      if (f && f !== '-' && f !== lemma && !f.includes(' ')) forms.add(f);
    }

    nouns.set(lemma, {
      pos: 'n',
      g,
      pl: pl && pl !== '-' ? pl : undefined,
      gen: gen && gen !== '-' ? gen : undefined,
      forms,
    });
  }
  return nouns;
}
