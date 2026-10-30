/**
 * Поиск слова на вкладке «Словарь»: карточка ИИ и карточка из настоящих словарей грузятся
 * одновременно. Если ИИ недоступен (лимит), показывается карточка словарей (этап 4).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import type { LanguageCode, WordResponse } from '../../shared/types';
import { api } from '../api/client';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';
import { useDictLookup } from './useDictLookup';
import type { DictState } from './useDictLookup';
export interface DictionarySearch {
  query: string;
  setQuery: (value: string) => void;
  card: WordResponse | null;
  dict: DictState;
  loading: boolean;
  error: TranslatorError | null;
  /** Лимит ИИ исчерпан — страница открывает окно подключения ключа. */
  onLimit: () => void;
  search: (event?: FormEvent) => Promise<void>;
  limitOpen: boolean;
  closeLimit: () => void;
}

/** Язык, на который смотрим слово: для немецкого интерфейса — русский, иначе немецкий. */
function targetFor(uiLanguage: string): LanguageCode {
  return uiLanguage === 'de' ? 'ru' : 'de';
}

export function useDictionarySearch(uiLanguage: string): DictionarySearch {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [card, setCard] = useState<WordResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TranslatorError | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { dict, loadDict, resetDict } = useDictLookup();

  // Уходим со страницы — отменяем незаконченный поиск.
  useEffect(() => () => abortRef.current?.abort(), []);

  const search = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const word = query.trim();
      if (!word) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      const target = targetFor(uiLanguage);
      // Словари грузятся вместе с ИИ: если ИИ недоступен, карточка будет из словарей.
      void loadDict(word, target, controller.signal);

      try {
        const response = await api.word({ word, sourceLang: 'auto', targetLang: target }, controller.signal);
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
    [query, uiLanguage, t, loadDict],
  );

  /** Новый запрос — сбрасываем прошлые карточки. */
  const searchFresh = useCallback(
    async (event?: FormEvent) => {
      resetDict();
      setCard(null);
      setError(null);
      await search(event);
    },
    [resetDict, search],
  );

  return {
    query,
    setQuery,
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
