/**
 * Подсказки при наборе одного слова (этап 8): сначала слова из истории и карточек пользователя
 * (локально, мгновенно), затем Wiktionary с сервера. Ответ сервера кэшируется на минуту,
 * чтобы не дёргать его на каждую новую букву.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageCode, SourceLanguage } from '../../shared/types';
import { api } from '../api/client';
import { useHistory } from './useHistory';
import { useStudy } from './useStudy';

/** Сколько букв нужно, чтобы искать подсказки. */
export const SUGGEST_MIN_LETTERS = 2;
/** Сколько подсказок показать. */
export const SUGGEST_LIMIT = 6;

/** Локальное начало списка: история переводов и свои карточки. */
function localWords(history: string[], cards: string[], query: string, limit: number): string[] {
  const prefix = query.toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const word of [...history, ...cards]) {
    const text = word.trim();
    const key = text.toLowerCase();
    if (!key || seen.has(key) || !key.startsWith(prefix)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

/** Кэш ответов сервера на время работы страницы: q|lang → слова. */
const responseCache = new Map<string, string[]>();

export function useSuggestions(text: string, sourceLang: SourceLanguage, enabled: boolean): string[] {
  const { items } = useHistory();
  const { cards } = useStudy();
  const [remote, setRemote] = useState<string[]>([]);
  const requestRef = useRef(0);

  const query = text.trim();
  // Подсказки только для одного слова: без пробелов, цифр и знаков препинания.
  const isSingleWord = /^[\p{L}\p{M}äöüÄÖÜß'’-]+$/u.test(query) && query.length >= SUGGEST_MIN_LETTERS;
  const active = enabled && isSingleWord;
  const lang: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;

  const historyWords = useMemo(() => items.map((item) => item.text), [items]);
  const cardWords = useMemo(() => cards.map((card) => card.lemma), [cards]);

  useEffect(() => {
    if (!active) {
      setRemote([]);
      return;
    }
    const key = `${lang}|${query.toLowerCase()}`;
    const cached = responseCache.get(key);
    if (cached) {
      setRemote(cached);
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void api
        .suggest(query, lang, controller.signal)
        .then((response) => {
          responseCache.set(key, response.items);
          if (requestId === requestRef.current) setRemote(response.items);
        })
        .catch(() => {
          // Сервер не ответил — остаются слова из истории и карточек.
          if (requestId === requestRef.current) setRemote([]);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [active, lang, query]);

  return useMemo(() => {
    if (!active) return [];
    const local = localWords(historyWords, cardWords, query, SUGGEST_LIMIT);
    const seen = new Set(local.map((word) => word.toLowerCase()));
    // Точное совпадение с введённым словом не подсказываем: переводить его и так можно.
    const rest = remote.filter((word) => {
      const key = word.toLowerCase();
      if (seen.has(key) || key === query.toLowerCase()) return false;
      seen.add(key);
      return true;
    });
    return [...local, ...rest].slice(0, SUGGEST_LIMIT);
  }, [active, cardWords, historyWords, query, remote]);
}
