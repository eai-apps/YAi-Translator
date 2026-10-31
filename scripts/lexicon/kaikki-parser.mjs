/**
 * Парсер выгрузки Викисловаря Kaikki.org для глаголов, прилагательных и транскрипций IPA.
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

function cleanIpa(raw) {
  if (!raw) return undefined;
  return raw.replace(/^\/|\/$/g, '').replace(/^\[|\]$/g, '').trim();
}

function extractVerbData(entry) {
  const forms = entry.forms || [];
  let p3, prt, p2, aux;
  const wordForms = new Set();

  for (const f of forms) {
    const val = f.form?.trim();
    if (!val || val.includes(' ') || val === entry.word) continue;
    wordForms.add(val);

    const tags = f.tags || [];
    if (!p3 && tags.includes('present') && tags.includes('third-person') && tags.includes('singular')) {
      p3 = val;
    }
    if (!prt && (tags.includes('past') || tags.includes('preterite')) && tags.includes('third-person') && tags.includes('singular')) {
      prt = val;
    }
    if (!p2 && tags.includes('participle') && tags.includes('past')) {
      p2 = val;
    }
    if (!aux && tags.includes('auxiliary')) {
      if (val === 'haben' || val === 'sein') aux = val;
    }
  }

  return {
    pos: 'v',
    p3,
    prt,
    p2,
    aux: aux || 'haben',
    forms: wordForms,
  };
}

function extractAdjData(entry) {
  const forms = entry.forms || [];
  let comp, sup;
  const wordForms = new Set();

  for (const f of forms) {
    const val = f.form?.trim();
    if (!val || val.includes(' ') || val === entry.word) continue;
    wordForms.add(val);

    const tags = f.tags || [];
    if (!comp && tags.includes('comparative')) comp = val;
    if (!sup && tags.includes('superlative')) sup = val;
  }

  return {
    pos: 'adj',
    comp,
    sup,
    forms: wordForms,
  };
}

export async function parseKaikki(filePath) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  const verbs = new Map();
  const adjs = new Map();
  const ipaMap = new Map();

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const word = entry.word?.trim();
      if (!word) continue;

      const ipa = cleanIpa(entry.sounds?.find((s) => s.ipa)?.ipa);
      if (ipa && !ipaMap.has(word)) ipaMap.set(word, ipa);

      if (entry.pos === 'verb' && !verbs.has(word)) {
        verbs.set(word, { ...extractVerbData(entry), ipa });
      } else if (entry.pos === 'adj' && !adjs.has(word)) {
        adjs.set(word, { ...extractAdjData(entry), ipa });
      }
    } catch {
      // Игнорируем битые строки JSONL
    }
  }
  return { verbs, adjs, ipaMap };
}
