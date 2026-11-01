import { fetchWordAsset } from '../lib/wordAsset';
/**
 * Хук для мгновенного поиска слова в собственной статической базе лексикона (этапы 11, 13, 14).
 * Загружает chunk /lex/<lang>/<xx>.json (2 буквы) с кэшированием в памяти и Service Worker.
 * Отдаёт результат за ~50 мс.
 * Поддерживает правила форм по языкам:
 * - en: -s, -es, -ed, -ing, -ies→y, неправильные went→go, children→child и др.
 * - de: умлауты, ge-...-t, -en, -ten, нерегулярные глаголы/существительные.
 * - fr/es/it/pt: -s/-es.
 * - ru/uk и остальные: формы через ссылки в базе.
 */
import { useEffect, useState } from 'react';
import type { LanguageCode } from '../../shared/types';
import { getGermanTranslation } from '../data/commonTranslationsDeRu';
import type {
  LexiconChunk,
  LexiconEntry,
  LexiconNounEntry,
  LexiconVerbEntry,
  LexiconAdjEntry,
  LexiconOtherEntry,
} from '../../shared/lexicon';
import { getLexiconPrefix, isLexiconRef } from '../../shared/lexicon';

export type ResolvedLexiconEntry =
  | LexiconNounEntry
  | LexiconVerbEntry
  | LexiconAdjEntry
  | LexiconOtherEntry;

export interface LexiconMatch {
  rawQuery: string;
  lemma: string;
  lang?: LanguageCode;
  entry: ResolvedLexiconEntry;
}

const memoryChunks = new Map<string, Promise<LexiconChunk | null>>();

export async function fetchChunk(prefix: string, lang = 'de'): Promise<LexiconChunk | null> {
  if (!prefix) return null;
  const key = `${lang}:${prefix}`;
  const existing = memoryChunks.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetchWordAsset(`/lex/${lang}/${prefix}.json`);
      if (!res.ok) return null;
      return (await res.json()) as LexiconChunk;
    } catch {
      return null;
    }
  })();

  memoryChunks.set(key, promise);
  void promise.then((chunk) => { if (!chunk) memoryChunks.delete(key); });
  return promise;
}

function findInChunk(chunk: LexiconChunk, word: string): { foundWord: string; entry: LexiconEntry } | null {
  if (chunk[word]) return { foundWord: word, entry: chunk[word] };
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  if (chunk[cap]) return { foundWord: cap, entry: chunk[cap] };
  const lower = word.toLowerCase();
  if (chunk[lower]) return { foundWord: lower, entry: chunk[lower] };
  return null;
}

/** Карта нерегулярных форм немецких глаголов и существительных */
const KNOWN_STEM_MAP_DE: Record<string, string> = {
  ging: 'gehen', gingen: 'gehen', gingst: 'gehen', gingt: 'gehen',
  kam: 'kommen', kamen: 'kommen', kamst: 'kommen', kamt: 'kommen',
  sah: 'sehen', sahen: 'sehen', sahst: 'sehen', saht: 'sehen',
  gab: 'geben', gaben: 'geben', gabst: 'geben', gabt: 'geben',
  nahm: 'nehmen', nahmen: 'nehmen', nahmst: 'nehmen', nahmt: 'nehmen',
  sprach: 'sprechen', sprachen: 'sprechen', sprachst: 'sprechen', spracht: 'sprechen',
  stand: 'stehen', standen: 'stehen', standst: 'stehen', standt: 'stehen',
  fuhr: 'fahren', fuhren: 'fahren', fuhrst: 'fahren', fuhrt: 'fahren',
  lief: 'laufen', liefen: 'laufen', liefst: 'laufen', lieft: 'laufen',
  blieb: 'bleiben', blieben: 'bleiben', bliebst: 'bleiben', bliebt: 'bleiben',
  fand: 'finden', fanden: 'finden', fandst: 'finden', fandt: 'finden',
  aß: 'essen', aßen: 'essen', aßt: 'essen',
  las: 'lesen', lasen: 'lesen', last: 'lesen',
  schrieb: 'schreiben', schrieben: 'schreiben', schriebst: 'schreiben', schriebt: 'schreiben',
  half: 'helfen', halfen: 'helfen', halfst: 'helfen', halft: 'helfen',
  trug: 'tragen', trugen: 'tragen', trugst: 'tragen', trugt: 'tragen',
  fiel: 'fallen', fielen: 'fallen', fielst: 'fallen', fielt: 'fallen',
  flog: 'fliegen', flogen: 'fliegen', zog: 'ziehen', zogen: 'ziehen',
  war: 'sein', waren: 'sein', warst: 'sein', wart: 'sein',
  hatte: 'haben', hatten: 'haben', hattest: 'haben', hattet: 'haben',
  wurde: 'werden', wurden: 'werden', wurdest: 'werden', wurdet: 'werden',
  häuser: 'Haus', häusern: 'Haus', bäume: 'Baum', bäumen: 'Baum',
  männer: 'Mann', männern: 'Mann', bücher: 'Buch', büchern: 'Buch',
  länder: 'Land', ländern: 'Land', städte: 'Stadt', städten: 'Stadt',
  hände: 'Hand', händen: 'Hand', züge: 'Zug', zügen: 'Zug',
  brüder: 'Bruder', brüdern: 'Bruder', töchter: 'Tochter', töchtern: 'Tochter',
  mütter: 'Mutter', müttern: 'Mutter', väter: 'Vater', vätern: 'Vater',
  ärzte: 'Arzt', ärzten: 'Arzt', köche: 'Koch', köchen: 'Koch',
};

/** Карта частых нерегулярных форм английских глаголов и существительных */
const KNOWN_STEM_MAP_EN: Record<string, string> = {
  went: 'go', gone: 'go', goes: 'go', going: 'go',
  children: 'child',
  men: 'man', women: 'woman', people: 'person',
  feet: 'foot', teeth: 'tooth', mice: 'mouse', geese: 'goose',
  came: 'come', saw: 'see', seen: 'see',
  did: 'do', done: 'do', does: 'do',
  was: 'be', were: 'be', been: 'be', am: 'be', is: 'be', are: 'be',
  had: 'have', has: 'have', having: 'have',
  made: 'make', took: 'take', taken: 'take',
  got: 'get', gotten: 'get',
  knew: 'know', known: 'know', thought: 'think',
  found: 'find', gave: 'give', given: 'give',
  told: 'tell', felt: 'feel', became: 'become',
  left: 'leave', brought: 'bring',
  began: 'begin', begun: 'begin', kept: 'keep', held: 'hold',
  wrote: 'write', written: 'write', stood: 'stand', heard: 'hear',
  let: 'let', meant: 'mean', set: 'set', met: 'meet', ran: 'run',
  paid: 'pay', sat: 'sit', spoke: 'speak', spoken: 'speak',
  lay: 'lie', lain: 'lie', led: 'lead', read: 'read',
  grew: 'grow', grown: 'grow', lost: 'lose',
  fell: 'fall', fallen: 'fall', sent: 'send', built: 'build',
  understood: 'understand', drew: 'draw', drawn: 'draw',
  broke: 'break', broken: 'break', spent: 'spend', cut: 'cut',
  rose: 'rise', risen: 'rise', drove: 'drive', driven: 'drive',
  bought: 'buy', wore: 'wear', worn: 'wear',
  chose: 'choose', chosen: 'choose', swam: 'swim', swum: 'swim',
  taught: 'teach', caught: 'catch', sang: 'sing', sung: 'sing',
  slept: 'sleep', ate: 'eat', eaten: 'eat',
  drank: 'drink', drunk: 'drink', threw: 'throw', thrown: 'throw',
  flew: 'fly', flown: 'fly', rode: 'ride', ridden: 'ride',
  shook: 'shake', shaken: 'shake', hid: 'hide', hidden: 'hide',
  stole: 'steal', stolen: 'steal', woke: 'wake', woken: 'wake',
  bit: 'bite', bitten: 'bite', blew: 'blow', blown: 'blow',
  hurt: 'hurt', hit: 'hit', hung: 'hang',
  froze: 'freeze', frozen: 'freeze', forgot: 'forget', forgotten: 'forget',
  forgave: 'forgive', forgiven: 'forgive',
  dreamt: 'dream', burnt: 'burn', shone: 'shine', shot: 'shoot',
};

function getGermanStemCandidates(word: string): string[] {
  const candidates: string[] = [];
  const lower = word.toLowerCase();

  if (KNOWN_STEM_MAP_DE[lower]) {
    candidates.push(KNOWN_STEM_MAP_DE[lower]);
  }

  const endings = [
    'ten', 'test', 'tet', 'end', 'te',
    'est', 'en', 'er', 'es', 'em',
    'st', 'e', 'n', 's', 't'
  ];

  for (const end of endings) {
    if (lower.length > end.length + 2 && lower.endsWith(end)) {
      const stem = lower.slice(0, -end.length);
      candidates.push(stem);
      candidates.push(stem + 'en');
      candidates.push(stem + 'n');

      const deUmlaut = stem
        .replace(/äu/g, 'au')
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u');
      if (deUmlaut !== stem) {
        candidates.push(deUmlaut);
        candidates.push(deUmlaut + 'e');
        candidates.push(deUmlaut + 'en');
      }
    }
  }

  if (lower.startsWith('ge') && lower.length > 5) {
    const unGe = lower.slice(2);
    if (unGe.endsWith('t')) {
      candidates.push(unGe.slice(0, -1) + 'en');
      candidates.push(unGe.slice(0, -1) + 'n');
    }
  }

  return [...new Set(candidates)];
}

function getEnglishStemCandidates(word: string): string[] {
  const candidates: string[] = [];
  const lower = word.toLowerCase();

  if (KNOWN_STEM_MAP_EN[lower]) {
    candidates.push(KNOWN_STEM_MAP_EN[lower]);
  }

  // -ies -> -y (cities -> city, studies -> study)
  if (lower.endsWith('ies') && lower.length > 4) {
    candidates.push(lower.slice(0, -3) + 'y');
  }

  // -ves -> -f / -fe (knives -> knife, wolves -> wolf)
  if (lower.endsWith('ves') && lower.length > 4) {
    candidates.push(lower.slice(0, -3) + 'f');
    candidates.push(lower.slice(0, -3) + 'fe');
  }

  // -es -> base / base+e (boxes -> box, watches -> watch, closes -> close)
  if (lower.endsWith('es') && lower.length > 3) {
    candidates.push(lower.slice(0, -2));
    candidates.push(lower.slice(0, -1));
  }

  // -s -> base (shops -> shop, books -> book)
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
    candidates.push(lower.slice(0, -1));
  }

  // -ing -> base, base+e, un-double (walking -> walk, making -> make, running -> run)
  if (lower.endsWith('ing') && lower.length > 4) {
    const stem = lower.slice(0, -3);
    candidates.push(stem);
    candidates.push(stem + 'e');
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      candidates.push(stem.slice(0, -1));
    }
    if (lower.endsWith('ying')) {
      candidates.push(lower.slice(0, -4) + 'ie');
    }
  }

  // -ed -> base, base+e, -ied->-y, un-double (walked -> walk, liked -> like, studied -> study)
  if (lower.endsWith('ed') && lower.length > 3) {
    candidates.push(lower.slice(0, -2));
    candidates.push(lower.slice(0, -1));
    if (lower.endsWith('ied') && lower.length > 4) {
      candidates.push(lower.slice(0, -3) + 'y');
    }
    const stem = lower.slice(0, -2);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      candidates.push(stem.slice(0, -1));
    }
  }

  // -er / -est (bigger -> big, fastest -> fast)
  if (lower.endsWith('er') && lower.length > 4) {
    candidates.push(lower.slice(0, -2));
    candidates.push(lower.slice(0, -1));
  }
  if (lower.endsWith('est') && lower.length > 5) {
    candidates.push(lower.slice(0, -3));
    candidates.push(lower.slice(0, -2));
  }

  return [...new Set(candidates)];
}

function getRomanceStemCandidates(word: string): string[] {
  const candidates: string[] = [];
  const lower = word.toLowerCase();
  if (lower.endsWith('es') && lower.length > 3) {
    candidates.push(lower.slice(0, -2));
    candidates.push(lower.slice(0, -1));
  } else if (lower.endsWith('s') && lower.length > 2) {
    candidates.push(lower.slice(0, -1));
  }
  return candidates;
}

export function getCandidatesForLanguage(word: string, lang: string): string[] {
  if (lang === 'de') return getGermanStemCandidates(word);
  if (lang === 'en') return getEnglishStemCandidates(word);
  if (['fr', 'es', 'it', 'pt'].includes(lang)) return getRomanceStemCandidates(word);
  return [];
}

export async function lookupLexicon(rawWord: string, lang = 'de'): Promise<LexiconMatch | null> {
  const clean = rawWord.trim().replace(/^[\p{P}\s«»„“"'`(\[]+|[\p{P}\s«»„“"'`.)\]]+$/gu, '');
  if (!clean || clean.length < 2) return null;

  const prefix = getLexiconPrefix(clean);
  if (!prefix) return null;

  const chunk = await fetchChunk(prefix, lang);
  let match = chunk ? findInChunk(chunk, clean) : null;

  // Известные нерегулярные формы глаголов и существительных (ging → gehen, went → go)
  const known =
    lang === 'de'
      ? KNOWN_STEM_MAP_DE[clean.toLowerCase()]
      : lang === 'en'
      ? KNOWN_STEM_MAP_EN[clean.toLowerCase()]
      : null;

  if (known) {
    const knownChunk = await fetchChunk(getLexiconPrefix(known), lang);
    const found = knownChunk ? findInChunk(knownChunk, known) : null;
    if (found) match = found;
  }

  // Прямое совпадение без перевода (для de) — пробуем основу с переводом
  if (lang === 'de' && match && !known && !isLexiconRef(match.entry) && !getGermanTranslation(match.foundWord)) {
    for (const cand of getGermanStemCandidates(clean)) {
      if (!getGermanTranslation(cand)) continue;
      const candChunk = await fetchChunk(getLexiconPrefix(cand), lang);
      const found = candChunk ? findInChunk(candChunk, cand) : null;
      if (found) { match = found; break; }
    }
  }

  // Если прямое совпадение не найдено — пробуем кандидаты по окончаниям
  if (!match) {
    const candidates = getCandidatesForLanguage(clean, lang);
    for (const cand of candidates) {
      const candPrefix = getLexiconPrefix(cand);
      const candChunk = candPrefix === prefix ? chunk : await fetchChunk(candPrefix, lang);
      if (!candChunk) continue;
      const found = findInChunk(candChunk, cand);
      if (found) {
        match = found;
        break;
      }
    }
  }

  if (!match) return null;

  // Если это форма, ссылающаяся на лемму: переходим к лемме
  if (isLexiconRef(match.entry)) {
    const lemma = match.entry.lemma;
    const lemmaPrefix = getLexiconPrefix(lemma);
    const targetChunk = await fetchChunk(lemmaPrefix, lang);
    if (!targetChunk) return null;
    const lemmaMatch = findInChunk(targetChunk, lemma);
    if (!lemmaMatch || isLexiconRef(lemmaMatch.entry)) return null;
    return {
      rawQuery: clean,
      lemma: lemmaMatch.foundWord,
      lang: lang as LanguageCode,
      entry: lemmaMatch.entry,
    };
  }

  return {
    rawQuery: clean,
    lemma: match.foundWord,
    lang: lang as LanguageCode,
    entry: match.entry,
  };
}

export function useLexicon(
  word: string,
  langOrEnabled: string | boolean = 'de',
  maybeEnabled = true,
): { match: LexiconMatch | null; loading: boolean } {
  const lang = typeof langOrEnabled === 'string' ? langOrEnabled : 'de';
  const enabled = typeof langOrEnabled === 'boolean' ? langOrEnabled : maybeEnabled;
  const [match, setMatch] = useState<LexiconMatch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = word.trim();
    if (!enabled || !trimmed || trimmed.includes(' ')) {
      setMatch(null);
      setLoading(false);
      return;
    }

    let active = true;
    setMatch(null);
    setLoading(true);

    lookupLexicon(trimmed, lang)
      .then((res) => {
        if (!active) return;
        setMatch(res);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setMatch(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [word, lang, enabled]);

  return { match: match?.rawQuery === word.trim() && match.lang === lang ? match : null, loading };
}
