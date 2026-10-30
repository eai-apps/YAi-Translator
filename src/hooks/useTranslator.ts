/**
 * Связывает ввод, выбор языков и запросы к API.
 * 1. Через 600 мс после ввода — обычный перевод без ИИ (быстро и бесплатно).
 * 2. Для 1–3 слов параллельно грузится полная карточка слова (ИИ, но с вечным кэшем на сервере).
 * 3. Кнопка «Спросить у AI» — перевод ИИ с альтернативами, только по нажатию.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ClassicProviderId,
  LanguageCode,
  SourceLanguage,
  TranslateResponse,
  WordResponse,
} from '../../shared/types';
import { api } from '../api/client';
import { STORAGE_KEYS, TRANSLATE_DEBOUNCE_MS } from '../config';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';
import { useHistory } from './useHistory';
import type { HistoryItem } from './useHistory';
import { useDictLookup } from './useDictLookup';
import { useCardLanguage, useLanguageSwitching } from './useLanguageSwitching';
import { useLocalStorage } from './useLocalStorage';

export type { TranslatorError };

/** Выбор переводчика: «авто» — по очереди, или конкретный сервис. */
export type ProviderChoice = 'auto' | ClassicProviderId;

export interface WordState {
  loading: boolean;
  data: WordResponse | null;
  error: TranslatorError | null;
}

const EMPTY_WORD: WordState = { loading: false, data: null, error: null };

/** Карточка слова из словарей (этап 4) живёт в отдельном хуке useDictLookup.ts. */
export type { DictState } from './useDictLookup';

/** 1–3 слова без знаков конца предложения: «Tisch», «aufstehen», «sich freuen auf». */
const WORD_QUERY = /^[\p{L}\p{M}'’-]+(?:\s+[\p{L}\p{M}'’-]+){0,2}$/u;

export function isWordQuery(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 60 && WORD_QUERY.test(trimmed);
}

/** Короткая подпись перевода для истории: первые значения слова. */
export function summarizeCard(card: WordResponse['card']): string {
  const first = card.meanings[0];
  if (!first) return card.lemma;
  return first.translations.slice(0, 3).join(', ');
}

export function useTranslator(onLimitReached: () => void) {
  const { t, i18n } = useTranslation();
  const { addItem } = useHistory();
  const [text, setText] = useState('');
  const [sourceLang, setSourceLangState] = useLocalStorage<SourceLanguage>(STORAGE_KEYS.sourceLang, 'auto');
  // Немецкий интерфейс по умолчанию переводит на русский, остальные — на немецкий.
  const defaultTarget: LanguageCode = i18n.language === 'de' ? 'ru' : 'de';
  const [targetLang, setTargetLangState] = useLocalStorage<LanguageCode>(STORAGE_KEYS.targetLang, defaultTarget);
  const [providerChoice, setProviderChoice] = useLocalStorage<ProviderChoice>(STORAGE_KEYS.provider, 'auto');

  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TranslatorError | null>(null);
  const [word, setWord] = useState<WordState>(EMPTY_WORD);
  // Словари грузятся параллельно с ИИ (этап 4).
  const { dict, loadDict, resetDict } = useDictLookup();
  const [aiLoading, setAiLoading] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const limitRef = useRef(onLimitReached);
  limitRef.current = onLimitReached;

  const detectedLang = useCardLanguage(result, word);

  /** Карточка слова — отдельно, чтобы перевод не ждал ИИ. */
  const loadWord = useCallback(
    async (value: string, source: SourceLanguage, target: LanguageCode, requestId: number, signal: AbortSignal) => {
      setWord({ loading: true, data: null, error: null });
      try {
        const data = await api.word({ word: value, sourceLang: source, targetLang: target }, signal);
        if (requestId !== requestRef.current) return;
        setWord({ loading: false, data, error: null });
      } catch (caught) {
        if (signal.aborted || requestId !== requestRef.current) return;
        setWord({ loading: false, data: null, error: toTranslatorError(caught, t('errors.unknown')) });
      }
    },
    [t],
  );

  /**
   * Словари — отдельно и параллельно с ИИ: карточка не ждёт, пока ИИ ответит или упрётся в лимит.
   * Номер основного запроса проверяет, что ответ про старое слово не перезапишет новое.
   */
  const loadDictFor = useCallback(
    (value: string, target: LanguageCode, requestId: number, signal: AbortSignal) => {
      void loadDict(value, target, signal).then(() => {
        if (requestId !== requestRef.current) resetDict();
      });
    },
    [loadDict, resetDict],
  );

  const run = useCallback(
    async (value: string, source: SourceLanguage, target: LanguageCode, choice: ProviderChoice) => {
      const trimmed = value.trim();
      setWord(EMPTY_WORD);
      resetDict();
      if (!trimmed) {
        setResult(null);
        setError(null);
        setLoading(false);
        return;
      }
      if (source !== 'auto' && source === target) {
        setResult(null);
        setError({ code: 'VALIDATION', message: t('errors.sameLanguage') });
        setLoading(false);
        return;
      }

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      // Словари и карточка ИИ грузятся вместе, не дожидаясь друг друга.
      if (isWordQuery(trimmed)) {
        void loadWord(trimmed, source, target, requestId, controller.signal);
        loadDictFor(trimmed, target, requestId, controller.signal);
      }

      try {
        const response = await api.translate(
          {
            text: trimmed,
            sourceLang: source,
            targetLang: target,
            mode: 'classic',
            ...(choice !== 'auto' ? { provider: choice } : {}),
          },
          controller.signal,
        );
        if (requestId !== requestRef.current) return;
        setResult(response);
        setHistoryId(
          addItem({
            text: trimmed,
            translation: response.translatedText,
            sourceLang: source,
            targetLang: target,
            kind: isWordQuery(trimmed) ? 'word' : 'text',
            article: null,
          }),
        );
      } catch (caught) {
        if (controller.signal.aborted || requestId !== requestRef.current) return;
        const apiError = toTranslatorError(caught, t('errors.unknown'));
        setResult(null);
        setError(apiError);
        if (apiError.code === 'LIMIT_REACHED') limitRef.current();
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [addItem, loadDictFor, loadWord, t],
  );

  // Перевод с задержкой 600 мс; смена текста, языков или переводчика отменяет старый запрос.
  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      setError(null);
      setWord(EMPTY_WORD);
      resetDict();
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void run(text, sourceLang, targetLang, providerChoice);
    }, TRANSLATE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [resetDict, run, text, sourceLang, targetLang, providerChoice]);

  // «Guten Tag» при цели «Немецкий»: язык текста совпал с целью — сами переключаем цель (de → ru, иначе → de).
  useEffect(() => {
    if (sourceLang !== 'auto' || !result?.detectedLang || result.detectedLang !== targetLang) return;
    setTargetLangState(targetLang === 'de' ? 'ru' : 'de');
  }, [result, sourceLang, targetLang, setTargetLangState]);

  /** «Спросить у AI»: перевод ИИ с альтернативами, заменяет обычный перевод. */
  const askAi = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const requestId = requestRef.current;
    setAiLoading(true);
    try {
      const response = await api.translate({ text: trimmed, sourceLang, targetLang, mode: 'ai' });
      if (requestId !== requestRef.current) return;
      setResult(response);
      setError(null);
    } catch (caught) {
      const apiError = toTranslatorError(caught, t('errors.unknown'));
      if (apiError.code === 'LIMIT_REACHED') limitRef.current();
      else setError(apiError);
    } finally {
      setAiLoading(false);
    }
  }, [text, sourceLang, targetLang, t]);

  const retryWord = useCallback(() => {
    const trimmed = text.trim();
    if (!isWordQuery(trimmed)) return;
    const controller = new AbortController();
    void loadWord(trimmed, sourceLang, targetLang, requestRef.current, controller.signal);
  }, [text, sourceLang, targetLang, loadWord]);

  const { changeSourceLang, changeTargetLang, swapLanguages } = useLanguageSwitching({
    sourceLang,
    setSourceLangState,
    targetLang,
    setTargetLangState,
    detectedLang,
    result,
    setText,
  });

  const retry = useCallback(() => {
    void run(text, sourceLang, targetLang, providerChoice);
  }, [run, text, sourceLang, targetLang, providerChoice]);

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    requestRef.current += 1;
    setText('');
    setResult(null);
    setError(null);
    setWord(EMPTY_WORD);
    resetDict();
    setLoading(false);
  }, [resetDict]);

  const applyIncoming = useCallback(
    (value: string, source: SourceLanguage, target: LanguageCode) => {
      setSourceLangState(source);
      setTargetLangState(target);
      setText(value);
    },
    [setSourceLangState, setTargetLangState],
  );

  return {
    text,
    setText,
    sourceLang,
    targetLang,
    result,
    loading,
    error,
    word,
    dict,
    aiLoading,
    providerChoice,
    setProviderChoice,
    detectedLang,
    historyId,
    setSourceLang: changeSourceLang,
    setTargetLang: changeTargetLang,
    swapLanguages,
    askAi,
    retry,
    retryWord,
    clearAll,
    applyIncoming,
  };
}

export type { HistoryItem };
