/**
 * Хук для мгновенного поиска слова в собственной статической базе лексикона (этап 11, этап 13).
 * Загружает chunk /lex/de/<xx>.json (2 буквы) с кэшированием в памяти и Service Worker.
 * Отдаёт результат за ~50 мс.
 * Учитывает формы: Häuser → Haus, ging → gehen, schönen → schön через ссылки и правила окончаний.
 */
import { useEffect, useState } from 'react';
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
  entry: ResolvedLexiconEntry;
}

const memoryChunks = new Map<string, Promise<LexiconChunk | null>>();

export async function fetchChunk(prefix: string): Promise<LexiconChunk | null> {
  if (!prefix) return null;
  const existing = memoryChunks.get(prefix);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`/lex/de/${prefix}.json`);
      if (!res.ok) return null;
      return (await res.json()) as LexiconChunk;
    } catch {
      return null;
    }
  })();

  memoryChunks.set(prefix, promise);
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

/** Карта частых нерегулярных форм немецких глаголов и существительных */
const KNOWN_STEM_MAP: Record<string, string> = {
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
  flog: 'fliegen', flogen: 'fliegen',
  zog: 'ziehen', zogen: 'ziehen',
  war: 'sein', waren: 'sein', warst: 'sein', wart: 'sein',
  hatte: 'haben', hatten: 'haben', hattest: 'haben', hattet: 'haben',
  wurde: 'werden', wurden: 'werden', wurdest: 'werden', wurdet: 'werden',
  // Умлауты во множественном числе существительных
  häuser: 'Haus', häusern: 'Haus',
  bäume: 'Baum', bäumen: 'Baum',
  männer: 'Mann', männern: 'Mann',
  bücher: 'Buch', büchern: 'Buch',
  länder: 'Land', ländern: 'Land',
  städte: 'Stadt', städten: 'Stadt',
  hände: 'Hand', händen: 'Hand',
  züge: 'Zug', zügen: 'Zug',
  brüder: 'Bruder', brüdern: 'Bruder',
  töchter: 'Tochter', töchtern: 'Tochter',
  mütter: 'Mutter', müttern: 'Mutter',
  väter: 'Vater', vätern: 'Vater',
  ärzte: 'Arzt', ärzten: 'Arzt',
  köche: 'Koch', köchen: 'Koch',
};

/** Генерирует вероятные кандидаты-леммы по правилам окончаний и умлаутов */
function getStemCandidates(word: string): string[] {
  const candidates: string[] = [];
  const lower = word.toLowerCase();

  // 1. Проверяем словарь особых форм
  if (KNOWN_STEM_MAP[lower]) {
    candidates.push(KNOWN_STEM_MAP[lower]);
  }

  // 2. Снятие окончаний прилагательных и глаголов
  const endings = [
    'ten', 'test', 'tet', 'end', 'te',
    'est', 'en', 'er', 'es', 'em',
    'st', 'e', 'n', 's', 't'
  ];

  for (const end of endings) {
    if (lower.length > end.length + 2 && lower.endsWith(end)) {
      const stem = lower.slice(0, -end.length);
      candidates.push(stem);
      // Если усекли глагол — проверяем инфинитив с -en или -n
      candidates.push(stem + 'en');
      candidates.push(stem + 'n');

      // Попытка снять умлаут с основы (äu -> au, ä -> a, ö -> o, ü -> u)
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

  // 3. Форма причастия ge-...-t / ge-...-(e)n
  if (lower.startsWith('ge') && lower.length > 5) {
    const unGe = lower.slice(2);
    if (unGe.endsWith('t')) {
      candidates.push(unGe.slice(0, -1) + 'en');
      candidates.push(unGe.slice(0, -1) + 'n');
    }
  }

  return [...new Set(candidates)];
}

export async function lookupLexicon(rawWord: string): Promise<LexiconMatch | null> {
  const clean = rawWord.trim().replace(/^[„"«'’`(\[]+|[“"»'’`.,!?;:)\]]+$/g, '');
  if (!clean || clean.length < 2) return null;

  const prefix = getLexiconPrefix(clean);
  if (!prefix) return null;

  const chunk = await fetchChunk(prefix);
  let match = chunk ? findInChunk(chunk, clean) : null;

  // Известная неправильная форма (ging → gehen) важнее заглушки «ging» в базе.
  const known = KNOWN_STEM_MAP[clean.toLowerCase()];
  if (known) {
    const knownChunk = await fetchChunk(getLexiconPrefix(known));
    const found = knownChunk ? findInChunk(knownChunk, known) : null;
    if (found) match = found;
  }

  // Прямое совпадение без перевода (часто это форма: kauften, schönen) — пробуем основу с переводом.
  if (match && !known && !isLexiconRef(match.entry) && !getGermanTranslation(match.foundWord)) {
    for (const cand of getStemCandidates(clean)) {
      if (!getGermanTranslation(cand)) continue;
      const candChunk = await fetchChunk(getLexiconPrefix(cand));
      const found = candChunk ? findInChunk(candChunk, cand) : null;
      if (found) { match = found; break; }
    }
  }

  // Если прямое совпадение не найдено — пробуем кандидаты по окончаниям и умлаутам
  if (!match) {
    const candidates = getStemCandidates(clean);
    for (const cand of candidates) {
      const candPrefix = getLexiconPrefix(cand);
      const candChunk = candPrefix === prefix ? chunk : await fetchChunk(candPrefix);
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
    const targetChunk = await fetchChunk(lemmaPrefix);
    if (!targetChunk) return null;
    const lemmaMatch = findInChunk(targetChunk, lemma);
    if (!lemmaMatch || isLexiconRef(lemmaMatch.entry)) return null;
    return {
      rawQuery: clean,
      lemma: lemmaMatch.foundWord,
      entry: lemmaMatch.entry,
    };
  }

  return {
    rawQuery: clean,
    lemma: match.foundWord,
    entry: match.entry,
  };
}

export function useLexicon(word: string, enabled = true): { match: LexiconMatch | null; loading: boolean } {
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
    setLoading(true);

    lookupLexicon(trimmed)
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
  }, [word, enabled]);

  return { match, loading };
}
