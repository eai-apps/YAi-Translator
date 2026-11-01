/**
 * Поиск слова на вкладке «Словарь»: карточка ИИ и карточка из настоящих словарей грузятся
 * одновременно. Если ИИ недоступен (лимит), показывается карточка словарей (этап 4).
 * Этап 8Б: слово — на любом из 12 языков сайта, язык слова и язык перевода выбираются отдельно
 * (как на экране перевода); «Определить» — язык ввода определяет сервер.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import type { LanguageCode, SourceLanguage, WordResponse } from '../../shared/types';
import { guessLanguage } from '../../shared/detect';
import { lookupLexicon } from './useLexicon';
import { assembleClientCard, getOfflineCard } from '../lib/offlineCards';
import { api } from '../api/client';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';
import { useDictLookup } from './useDictLookup';
import type { DictState } from './useDictLookup';

export interface DictionarySearch {
  query: string;
  setQuery: (value: string) => void;
  /** Язык слова: «auto» — определить самим. */
  sourceLang: SourceLanguage;
  setSourceLang: (value: SourceLanguage) => void;
  /** Язык перевода. */
  targetLang: LanguageCode;
  setTargetLang: (value: LanguageCode) => void;
  card: WordResponse | null;
  dict: DictState;
  loading: boolean;
  error: TranslatorError | null;
  /** Лимит ИИ исчерпан — страница открывает окно подключения ключа. */
  onLimit: () => void;
  search: (eventOrWord?: FormEvent | string, forceAi?: boolean) => Promise<void>;
  limitOpen: boolean;
  closeLimit: () => void;
}

/** Язык, на который смотрим слово: для немецкого интерфейса — русский, иначе немецкий. */
export function defaultTargetFor(uiLanguage: string): LanguageCode {
  return uiLanguage === 'de' ? 'ru' : 'de';
}

export function useDictionarySearch(uiLanguage: string): DictionarySearch {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [sourceLang, setSourceLang] = useState<SourceLanguage>('auto');
  const [targetLang, setTargetLang] = useState<LanguageCode>(() => defaultTargetFor(uiLanguage));
  const [card, setCard] = useState<WordResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TranslatorError | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { dict, loadDict, resetDict } = useDictLookup();

  // Уходим со страницы — отменяем незаконченный поиск.
  useEffect(() => () => abortRef.current?.abort(), []);

  const search = useCallback(
    async (eventOrWord?: FormEvent | string, forceAi = false) => {
      if (typeof eventOrWord === 'object' && eventOrWord && 'preventDefault' in eventOrWord) {
        eventOrWord.preventDefault();
      }
      const word = (typeof eventOrWord === 'string' ? eventOrWord : query).trim();
      if (!word) return;
      if (typeof eventOrWord === 'string') setQuery(word);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      // Словари грузятся вместе с ИИ: если ИИ недоступен, карточка будет из словарей.
      // При «Определить» словари смотрят в обратную пару (ru → de при цели de), как на сервере.
      const dictSource: LanguageCode =
        sourceLang === 'auto' ? (targetLang === 'de' ? 'ru' : 'de') : sourceLang;
      if (dictSource !== targetLang) void loadDict(word, targetLang, controller.signal, sourceLang);

      try {
        const lang = sourceLang === 'auto' ? guessLanguage(word) ?? 'de' : sourceLang;
        const local = await lookupLexicon(word, lang);
        if (controller.signal.aborted) return;
        if (local && !forceAi) {
          const explanation = lang === targetLang ? 'ru' : targetLang;
          const localCard = await getOfflineCard(local.lemma, lang, explanation) ?? assembleClientCard(local.lemma, lang, explanation, local.entry);
          if (!controller.signal.aborted) setCard({ card: localCard, provider: 'dict', cached: true });
          return;
        }
        if (!forceAi) return;
        const response = await api.word({ word, sourceLang, targetLang }, controller.signal);
        if (controller.signal.aborted) return;
        setCard(response);
      } catch (caught) {
        if (controller.signal.aborted) return;
        const apiError = toTranslatorError(caught, t('errors.unknown'));
        setCard(null);
        setError(apiError);
        if (apiError.code === 'LIMIT_REACHED') setLimitOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [query, sourceLang, targetLang, t, loadDict],
  );

  /** Новый запрос — сбрасываем прошлые карточки. */
  const searchFresh = useCallback(
    async (eventOrWord?: FormEvent | string, forceAi = false) => {
      resetDict();
      setCard(null);
      setError(null);
      await search(eventOrWord, forceAi);
    },
    [resetDict, search],
  );

  return {
    query,
    setQuery,
    sourceLang,
    setSourceLang,
    targetLang,
    setTargetLang,
    card,
    dict,
    loading,
    error,
    search: searchFresh,
    limitOpen,
    onLimit: () => setLimitOpen(true),
    closeLimit: () => setLimitOpen(false),
  };
}
