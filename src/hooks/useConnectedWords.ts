/**
 * Хук для связывания каждого немецкого слова перевода с базой лексикона (этап 13).
 * Разбивает немецкий текст на слова, фильтрует служебные слова,
 * находит леммы в public/lex/de/*.json и прикрепляет переводы.
 */
import { useEffect, useState } from 'react';
import type { LexiconMatch } from './useLexicon';
import { lookupLexicon } from './useLexicon';
import { getGermanTranslation } from '../data/commonTranslationsDeRu';

export interface ConnectedWordItem {
  raw: string;
  match: LexiconMatch;
  translation?: string;
  article?: 'der' | 'die' | 'das' | null;
}

/** Список немецких служебных слов (стоп-слов), которые не показываются в чипах словаря */
export const GERMAN_STOP_WORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  'und', 'oder', 'aber', 'denn', 'doch', 'sondern',
  'ist', 'sind', 'war', 'waren', 'bin', 'bist', 'seid',
  'wird', 'werden', 'wurde', 'wurden',
  'hat', 'haben', 'hatte', 'hatten', 'hab',
  'zu', 'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'mit', 'nach', 'von', 'vom', 'vor',
  'um', 'ums', 'über', 'unter', 'für', 'gegen', 'ohne', 'durch', 'bis', 'seit', 'ab',
  'als', 'wie', 'so', 'da', 'es', 'er', 'sie', 'wir', 'ihr', 'ich', 'du', 'man',
  'mich', 'dich', 'sich', 'uns', 'euch', 'ihm', 'ihn', 'ihnen',
  'mein', 'meine', 'meinen', 'meiner', 'meines', 'meinem',
  'dein', 'deine', 'deinen', 'deiner', 'deines', 'deinem',
  'sein', 'seine', 'seinen', 'seiner', 'seines', 'seinem',
  'ihr', 'ihre', 'ihren', 'ihrer', 'ihres', 'ihrem',
  'unser', 'unsere', 'unseren', 'unserer', 'unseres', 'unserem',
  'euer', 'eure', 'euren', 'eurer', 'eures', 'eurem',
  'kein', 'keine', 'keinen', 'keiner', 'keines', 'keinem',
  'nicht', 'noch', 'schon', 'nur', 'auch', 'wenn', 'weil', 'dass', 'daß', 'ob',
  'ja', 'nein', 'mal', 'hier', 'dort', 'nun', 'jetzt', 'sehr', 'viel', 'mehr', 'ganz', 'gar',
  'etwas', 'nichts', 'alles', 'alle', 'wer', 'was', 'wo', 'wann', 'warum', 'welche', 'welcher', 'welches',
]);

export function isStopWord(word: string): boolean {
  return GERMAN_STOP_WORDS.has(word.trim().toLowerCase());
}

export function extractGermanTokens(text: string): string[] {
  if (!text) return [];
  // Извлекаем слова из немецкого текста с поддержкой умлаутов и эсцет
  const matches = text.match(/[\p{L}\p{M}äöüßÄÖÜ]+/gu) || [];
  return matches.map((m) => m.trim()).filter((m) => m.length >= 2);
}

export function useConnectedWords(germanText: string, enabled = true): {
  items: ConnectedWordItem[];
  matchedWordsMap: Map<string, ConnectedWordItem>;
  loading: boolean;
} {
  const [items, setItems] = useState<ConnectedWordItem[]>([]);
  const [matchedWordsMap, setMatchedWordsMap] = useState<Map<string, ConnectedWordItem>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const text = germanText.trim();
    if (!enabled || !text) {
      setItems([]);
      setMatchedWordsMap(new Map());
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const tokens = extractGermanTokens(text);
    // Отбираем уникальные слова без стоп-слов для чипов
    const uniqueTokens: string[] = [];
    const seen = new Set<string>();

    for (const t of tokens) {
      const lower = t.toLowerCase();
      if (!isStopWord(lower) && !seen.has(lower)) {
        seen.add(lower);
        uniqueTokens.push(t);
      }
    }

    // Ограничиваем первыми 16 кандидатами, чтобы получить до 12 чипов
    const candidates = uniqueTokens.slice(0, 16);

    Promise.all(
      candidates.map(async (token) => {
        const match = await lookupLexicon(token);
        if (!match) return null;
        // Существительные в немецком всегда с большой буквы: «gestern» — не «das Gestern».
        if (token[0] === token[0].toLowerCase() && match.entry.pos === 'n') return null;

        const translation = getGermanTranslation(match.lemma);
        const article = match.entry.pos === 'n' ? match.entry.g : null;

        return {
          raw: token,
          match,
          translation,
          article,
        } as ConnectedWordItem;
      }),
    ).then((results) => {
      if (!active) return;

      const nonNull = results.filter((r): r is ConnectedWordItem => r !== null);
      // Убираем возможные дубликаты по лемме
      const lemmaSeen = new Set<string>();
      const finalItems: ConnectedWordItem[] = [];
      const newMap = new Map<string, ConnectedWordItem>();

      for (const item of nonNull) {
        if (!lemmaSeen.has(item.match.lemma.toLowerCase())) {
          lemmaSeen.add(item.match.lemma.toLowerCase());
          if (finalItems.length < 12) {
            finalItems.push(item);
          }
        }
        // Заносим в карту поиска по исходному слову и лемме
        newMap.set(item.raw.toLowerCase(), item);
        newMap.set(item.match.lemma.toLowerCase(), item);
      }

      setItems(finalItems);
      setMatchedWordsMap(newMap);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setItems([]);
      setMatchedWordsMap(new Map());
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [germanText, enabled]);

  return { items, matchedWordsMap, loading };
}
