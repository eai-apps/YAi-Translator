/**
 * Хук для связывания каждого слова перевода с базой лексикона (этап 13, этап 14).
 * Поддерживает любой язык (de, en, ru, uk, fr, es, it, pt, pl, nl, tr, ar),
 * фильтрует стоп-слова для соответствующего языка и подставляет перевод
 * на язык пользователя из поля tr базы лексикона.
 */
import { useEffect, useState } from 'react';
import type { LanguageCode } from '../../shared/types';
import type { LexiconMatch, ResolvedLexiconEntry } from './useLexicon';
import { lookupLexicon } from './useLexicon';
import { getGermanTranslation } from '../data/commonTranslationsDeRu';
import { isStopWord, STOPWORDS_DE } from '../data/stopwords';

export interface ConnectedWordItem {
  raw: string;
  match: LexiconMatch;
  translation?: string;
  article?: 'der' | 'die' | 'das' | 'm' | 'f' | null;
  lang?: LanguageCode;
}

/** Совместимость со старым импортом GERMAN_STOP_WORDS */
export const GERMAN_STOP_WORDS = STOPWORDS_DE;

/** Извлечение слов с поддержкой Unicode (буквы и диакритика любого языка) */
export function extractTokens(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[\p{L}\p{M}]+/gu) || [];
  return matches.map((m) => m.trim()).filter((m) => m.length >= 2);
}

/** Совместимость со старым именем */
export const extractGermanTokens = extractTokens;

export function resolveTranslation(
  entry: ResolvedLexiconEntry,
  lemma: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
): string | undefined {
  if (entry.tr) {
    const list =
      entry.tr[targetLang] ||
      (targetLang !== 'ru' ? entry.tr.ru : undefined) ||
      (targetLang !== 'en' ? entry.tr.en : undefined) ||
      (targetLang !== 'de' ? entry.tr.de : undefined) ||
      (targetLang !== 'uk' ? entry.tr.uk : undefined);
    if (list && list.length > 0) return list[0];
  }
  if (sourceLang === 'de') {
    return getGermanTranslation(lemma);
  }
  return undefined;
}

export function useConnectedWords(
  text: string,
  lang: LanguageCode = 'de',
  targetLang: LanguageCode = 'ru',
  enabled = true,
): {
  items: ConnectedWordItem[];
  matchedWordsMap: Map<string, ConnectedWordItem>;
  loading: boolean;
} {
  const [items, setItems] = useState<ConnectedWordItem[]>([]);
  const [matchedWordsMap, setMatchedWordsMap] = useState<Map<string, ConnectedWordItem>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = text.trim();
    if (!enabled || !trimmed) {
      setItems([]);
      setMatchedWordsMap(new Map());
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const tokens = extractTokens(trimmed);
    const uniqueTokens: string[] = [];
    const seen = new Set<string>();

    for (const t of tokens) {
      const lower = t.toLowerCase();
      if (!isStopWord(lower, lang) && !seen.has(lower)) {
        seen.add(lower);
        uniqueTokens.push(t);
      }
    }

    // Первые 16 кандидатов, чтобы получить до 12 чипов
    const candidates = uniqueTokens.slice(0, 16);

    Promise.all(
      candidates.map(async (token) => {
        const match = await lookupLexicon(token, lang);
        if (!match) return null;

        // В немецком существительные с большой буквы: «gestern» не «das Gestern»
        if (lang === 'de' && token[0] === token[0].toLowerCase() && match.entry.pos === 'n') return null;

        const translation = resolveTranslation(match.entry, match.lemma, lang, targetLang);
        const article =
          match.entry.pos === 'n' && match.entry.g
            ? (match.entry.g as 'der' | 'die' | 'das' | 'm' | 'f')
            : null;

        return {
          raw: token,
          match,
          translation,
          article,
          lang,
        } as ConnectedWordItem;
      }),
    )
      .then((results) => {
        if (!active) return;

        const nonNull = results.filter((r): r is ConnectedWordItem => r !== null);
        const lemmaSeen = new Set<string>();
        const finalItems: ConnectedWordItem[] = [];
        const newMap = new Map<string, ConnectedWordItem>();

        for (const item of nonNull) {
          const lKey = item.match.lemma.toLowerCase();
          if (!lemmaSeen.has(lKey)) {
            lemmaSeen.add(lKey);
            if (finalItems.length < 12) {
              finalItems.push(item);
            }
          }
          newMap.set(item.raw.toLowerCase(), item);
          newMap.set(lKey, item);
        }

        setItems(finalItems);
        setMatchedWordsMap(newMap);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setMatchedWordsMap(new Map());
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [text, lang, targetLang, enabled]);

  return { items, matchedWordsMap, loading };
}
