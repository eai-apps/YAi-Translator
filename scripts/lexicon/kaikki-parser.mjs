/**
 * Парсер выгрузки Викисловаря Kaikki.org для глаголов, существительных,
 * прилагательных, форм, транскрипций IPA и переводов (этапы 11, 14).
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export function cleanIpa(raw) {
  if (!raw) return undefined;
  return raw.replace(/^\/|\/$/g, '').replace(/^\[|\]$/g, '').trim();
}

export function cleanTranslation(raw) {
  if (!raw) return '';
  // Убираем знак ударения (комбинирующий акут \u0301) и пунктуацию
  return raw
    .replace(/\u0301/g, '')
    .replace(/^[\p{P}\s«»„“"'`(\[]+|[\p{P}\s«»„“"'`.)\]]+$/gu, '')
    .trim();
}

/** Извлечение форм и грамматики глагола */
export function extractVerbData(entry, lang = 'de') {
  const forms = entry.forms || [];
  let p3, prt, p2, aux;
  const wordForms = new Set();

  for (const f of forms) {
    const val = f.form?.trim();
    if (!val || val.includes(' ') || val === entry.word) continue;
    wordForms.add(val);

    const tags = f.tags || [];
    if (!p3 && tags.includes('present') && (tags.includes('third-person') || tags.includes('singular-third-person')) && tags.includes('singular')) {
      p3 = val;
    }
    if (!prt && (tags.includes('past') || tags.includes('preterite')) && (lang === 'en' || (tags.includes('third-person') && tags.includes('singular')))) {
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
    ...(p3 ? { p3 } : {}),
    ...(prt ? { prt } : {}),
    ...(p2 ? { p2 } : {}),
    ...(aux ? { aux } : lang === 'de' ? { aux: 'haben' } : {}),
    forms: wordForms,
  };
}

/** Извлечение форм существительного */
export function extractNounData(entry) {
  const forms = entry.forms || [];
  let pl, gen;
  const wordForms = new Set();

  for (const f of forms) {
    const val = f.form?.trim();
    if (!val || val.includes(' ') || val === entry.word) continue;
    wordForms.add(val);

    const tags = f.tags || [];
    if (!pl && tags.includes('plural') && !tags.includes('obsolete')) {
      pl = val;
    }
    if (!gen && tags.includes('genitive') && tags.includes('singular')) {
      gen = val;
    }
  }

  return {
    pos: 'n',
    ...(pl ? { pl } : {}),
    ...(gen ? { gen } : {}),
    forms: wordForms,
  };
}

/** Извлечение форм прилагательного */
export function extractAdjData(entry) {
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
    ...(comp ? { comp } : {}),
    ...(sup ? { sup } : {}),
    forms: wordForms,
  };
}

/** Извлечение переводов на ru, de, en, uk из senses и root translations Kaikki */
export function extractTranslations(entry, currentLang = 'en') {
  const tr = {};
  const targetCodes = ['ru', 'de', 'en', 'uk'].filter((c) => c !== currentLang);

  for (const code of targetCodes) {
    tr[code] = [];
  }

  // Сначала берём корневые переводы (в Kaikki/Wiktionary это основные значения слова)
  for (const t of entry.translations || []) {
    const code = t.code;
    if (code && targetCodes.includes(code)) {
      const clean = cleanTranslation(t.word);
      if (clean && clean.length >= 2 && !tr[code].includes(clean) && tr[code].length < 4) {
        tr[code].push(clean);
      }
    }
  }

  // Затем дополняем переводами из senses, если лимит ещё не достигнут
  for (const sense of entry.senses || []) {
    for (const t of sense.translations || []) {
      const code = t.code;
      if (code && targetCodes.includes(code)) {
        const clean = cleanTranslation(t.word);
        if (clean && clean.length >= 2 && !tr[code].includes(clean) && tr[code].length < 4) {
          tr[code].push(clean);
        }
      }
    }
  }

  // Оставляем только те языки, для которых найдены переводы
  const result = {};
  for (const code of targetCodes) {
    if (tr[code].length > 0) result[code] = tr[code];
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Универсальный парсинг Kaikki для любого языка.
 * Извлекает леммы с частями речи, формами, IPA и переводами (ru, de, en, uk).
 */
export async function parseKaikkiUniversal(filePath, lang, { frequencySet, maxLemmas = 60000 } = {}) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  const entries = new Map(); // lemma -> { pos, forms, ipa, ipaUk, ipaUs, tr, ... }
  const formToLemma = new Map(); // form -> lemma

  let linesCount = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    linesCount++;

    try {
      const entry = JSON.parse(line);
      const word = entry.word?.trim();
      if (!word || word.includes(' ') || word.length < 2) continue;

      const pos =
        entry.pos === 'noun'
          ? 'n'
          : entry.pos === 'verb'
          ? 'v'
          : entry.pos === 'adj'
          ? 'adj'
          : entry.pos === 'adv'
          ? 'adv'
          : 'other';

      // Извлечение IPA
      const sounds = entry.sounds || [];
      const ipaUkRaw = sounds.find((s) => s.ipa && s.tags?.some((t) => t.includes('UK') || t.includes('Received')));
      const ipaUsRaw = sounds.find((s) => s.ipa && s.tags?.some((t) => t.includes('US') || t.includes('General-American')));
      const ipaGeneralRaw = sounds.find((s) => s.ipa);

      const ipaUk = cleanIpa(ipaUkRaw?.ipa);
      const ipaUs = cleanIpa(ipaUsRaw?.ipa);
      const ipa = cleanIpa(ipaGeneralRaw?.ipa);

      // Извлечение переводов на ru, de, en, uk
      const tr = extractTranslations(entry, lang);

      // Проверяем фильтр: если слово не в частотном списке и нет переводов — пропускаем, если база переполнена
      const isFrequent = frequencySet ? frequencySet.has(word.toLowerCase()) : false;
      const hasTr = Boolean(tr);

      // Извлечение форм
      let parsedData;
      if (pos === 'v') parsedData = extractVerbData(entry, lang);
      else if (pos === 'n') parsedData = extractNounData(entry);
      else if (pos === 'adj') parsedData = extractAdjData(entry);
      else {
        const forms = new Set();
        for (const f of entry.forms || []) {
          const val = f.form?.trim();
          if (val && !val.includes(' ') && val !== word) forms.add(val);
        }
        parsedData = { pos, forms };
      }

      // Сохраняем лемму, если она частая или с переводом (до лимита maxLemmas)
      if ((isFrequent || hasTr || entries.size < maxLemmas) && !entries.has(word)) {
        if (entries.size >= maxLemmas && !isFrequent) {
          // Лимит достигнут
        } else {
          entries.set(word, {
            pos,
            ...parsedData,
            ...(ipa ? { ipa } : {}),
            ...(ipaUk ? { ipaUk } : {}),
            ...(ipaUs ? { ipaUs } : {}),
            ...(tr ? { tr } : {}),
          });

          // Сохраняем ссылки форма -> лемма
          for (const form of parsedData.forms || []) {
            if (!formToLemma.has(form)) {
              formToLemma.set(form, word);
            }
          }
        }
      } else if (entries.has(word)) {
        // Обогащаем существующую лемму формами и переводами, если появились новые
        const existing = entries.get(word);
        if (!existing.tr && tr) existing.tr = tr;
        else if (existing.tr && tr) {
          for (const [code, list] of Object.entries(tr)) {
            if (!existing.tr[code]) existing.tr[code] = list;
            else {
              for (const item of list) {
                if (!existing.tr[code].includes(item) && existing.tr[code].length < 4) {
                  existing.tr[code].push(item);
                }
              }
            }
          }
        }
        for (const form of parsedData.forms || []) {
          existing.forms.add(form);
          if (!formToLemma.has(form)) formToLemma.set(form, word);
        }
      }
    } catch {
      // Игнорируем битые строки JSONL
    }
  }

  return { entries, formToLemma };
}

/** Совместимость с исходным parseKaikki для немецкого языка */
export async function parseKaikki(filePath) {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  const verbs = new Map();
  const adjs = new Map();
  const ipaMap = new Map();
  const translationsMap = new Map(); // word -> tr

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const word = entry.word?.trim();
      if (!word) continue;

      const ipa = cleanIpa(entry.sounds?.find((s) => s.ipa)?.ipa);
      if (ipa && !ipaMap.has(word)) ipaMap.set(word, ipa);

      const tr = extractTranslations(entry, 'de');
      if (tr && !translationsMap.has(word)) translationsMap.set(word, tr);

      if (entry.pos === 'verb' && !verbs.has(word)) {
        verbs.set(word, { ...extractVerbData(entry, 'de'), ipa, tr });
      } else if (entry.pos === 'adj' && !adjs.has(word)) {
        adjs.set(word, { ...extractAdjData(entry), ipa, tr });
      }
    } catch {
      // Игнорируем битые строки
    }
  }
  return { verbs, adjs, ipaMap, translationsMap };
}
