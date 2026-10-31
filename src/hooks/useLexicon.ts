/**
 * Хук для мгновенного поиска слова в собственной статической базе лексикона (этап 11).
 * Загружает chunk /lex/de/<xx>.json (2 буквы) с кэшированием в памяти и Service Worker.
 * Отдаёт результат за ~50 мс.
 */
import { useEffect, useState } from 'react';
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

async function fetchChunk(prefix: string): Promise<LexiconChunk | null> {
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

export async function lookupLexicon(rawWord: string): Promise<LexiconMatch | null> {
  const clean = rawWord.trim().replace(/^[„"«'’`]+|[“"»'’`.,!?;:]+$/g, '');
  if (!clean || clean.length < 2) return null;

  const prefix = getLexiconPrefix(clean);
  if (!prefix) return null;

  const chunk = await fetchChunk(prefix);
  if (!chunk) return null;

  const match = findInChunk(chunk, clean);
  if (!match) return null;

  // Если это форма, ссылающаяся на лемму: переходим к лемме
  if (isLexiconRef(match.entry)) {
    const lemma = match.entry.lemma;
    const lemmaPrefix = getLexiconPrefix(lemma);
    const targetChunk = lemmaPrefix === prefix ? chunk : await fetchChunk(lemmaPrefix);
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
