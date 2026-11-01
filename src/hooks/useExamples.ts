import { fetchWordAsset } from '../lib/wordAsset';
/**
 * Хук для загрузки реальных примеров предложений из базы Tatoeba (этап 15).
 * Загружает chunk /ex/<lang>/<xx>.json (2 буквы) с кэшированием в памяти.
 * Примеры нарезаны по леммам, содержат перевод (ru, de, en, uk) и id предложения Tatoeba.
 */
import { useEffect, useState } from 'react';
import type { ExampleChunk, ExampleSentence } from '../../shared/lexicon';
import { getLexiconPrefix } from '../../shared/lexicon';
import type { LanguageCode } from '../../shared/types';

const memoryExampleChunks = new Map<string, Promise<ExampleChunk | null>>();

export async function fetchExampleChunk(prefix: string, lang = 'de'): Promise<ExampleChunk | null> {
  if (!prefix) return null;
  const key = `${lang}:${prefix}`;
  const existing = memoryExampleChunks.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetchWordAsset(`/ex/${lang}/${prefix}.json`);
      if (!res.ok) return null;
      return (await res.json()) as ExampleChunk;
    } catch {
      return null;
    }
  })();

  memoryExampleChunks.set(key, promise);
  return promise;
}

export async function lookupExamples(word: string, lang = 'de'): Promise<ExampleSentence[] | null> {
  const clean = word.trim();
  if (!clean || clean.length < 2) return null;

  const prefix = getLexiconPrefix(clean);
  const chunk = await fetchExampleChunk(prefix, lang);
  if (!chunk) return null;

  if (chunk[clean]) return chunk[clean];

  const lower = clean.toLowerCase();
  if (chunk[lower]) return chunk[lower];

  const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (chunk[cap]) return chunk[cap];

  return null;
}

export function useExamples(lemma: string | null | undefined, lang: LanguageCode | string = 'de') {
  const [examples, setExamples] = useState<ExampleSentence[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lemma || lemma.trim().length < 2) {
      setExamples([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    lookupExamples(lemma, lang)
      .then((res) => {
        if (!active) return;
        setExamples(res || []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setExamples([]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lemma, lang]);

  return { examples, loading };
}
