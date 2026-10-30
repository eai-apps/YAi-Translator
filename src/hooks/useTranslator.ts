/** Связывает ввод, выбор языков и запросы к API: 600 мс ожидания, отмена старых запросов. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
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
import { useLocalStorage } from './useLocalStorage';

export type TranslationResult =
  | { kind: 'text'; response: TranslateResponse }
  | { kind: 'word'; response: WordResponse };

export type { TranslatorError };

const SINGLE_WORD = /^[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*\.?$/u;

/** Одно слово (без пробелов) — показываем карточку, иначе обычный перевод. */
export function isSingleWord(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 60 && SINGLE_WORD.test(trimmed);
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
  const [sourceLang, setSourceLangState] = useLocalStorage<SourceLanguage>(
    STORAGE_KEYS.sourceLang,
    'auto',
  );
  // Немецкий интерфейс по умолчанию переводит на русский, остальные — на немецкий.
  const defaultTarget: LanguageCode = i18n.language === 'de' ? 'ru' : 'de';
  const [targetLang, setTargetLangState] = useLocalStorage<LanguageCode>(
    STORAGE_KEYS.targetLang,
    defaultTarget,
  );
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TranslatorError | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Колбэк храним в ref: родитель может передавать новую стрелочную функцию каждый рендер.
  const limitRef = useRef(onLimitReached);
  limitRef.current = onLimitReached;

  const detectedLang = useMemo<LanguageCode | null>(() => {
    if (!result) return null;
    return result.kind === 'text' ? result.response.detectedLang : result.response.card.language;
  }, [result]);

  const run = useCallback(
    async (value: string, source: SourceLanguage, target: LanguageCode) => {
      const trimmed = value.trim();
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

      try {
        // Карточка слова требует ИИ. Если лимит ИИ закончился — переводим слово
        // обычным переводчиком, чтобы человек всё равно получил ответ.
        let wordResponse: WordResponse | null = null;
        if (isSingleWord(trimmed)) {
          try {
            wordResponse = await api.word(
              { word: trimmed, sourceLang: source, targetLang: target },
              controller.signal,
            );
          } catch (wordError) {
            const code = toTranslatorError(wordError, '').code;
            if (controller.signal.aborted || code !== 'LIMIT_REACHED') throw wordError;
          }
        }

        if (wordResponse) {
          const response = wordResponse;
          if (requestId !== requestRef.current) return;
          setResult({ kind: 'word', response });
          setHistoryId(
            addItem({
              text: trimmed,
              translation: summarizeCard(response.card),
              sourceLang: source,
              targetLang: target,
              kind: 'word',
              article: response.card.article,
            }),
          );
        } else {
          const response = await api.translate(
            {
              text: trimmed,
              sourceLang: source,
              targetLang: target,
              mode: isSingleWord(trimmed) ? 'classic' : 'auto',
            },
            controller.signal,
          );
          if (requestId !== requestRef.current) return;
          setResult({ kind: 'text', response });
          setHistoryId(
            addItem({
              text: trimmed,
              translation: response.translatedText,
              sourceLang: source,
              targetLang: target,
              kind: 'text',
              article: null,
            }),
          );
        }
      } catch (caught) {
        if (controller.signal.aborted) return;
        if (requestId !== requestRef.current) return;
        const apiError = toTranslatorError(caught, t('errors.unknown'));
        setResult(null);
        setError(apiError);
        if (apiError.code === 'LIMIT_REACHED') limitRef.current();
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [addItem, t],
  );

  // Перевод с задержкой 600 мс; смена текста или языков отменяет старый запрос.
  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void run(text, sourceLang, targetLang);
    }, TRANSLATE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [text, sourceLang, targetLang, run]);

  const changeSourceLang = useCallback(
    (next: SourceLanguage) => {
      setSourceLangState(next);
      if (next !== 'auto' && next === targetLang) {
        let fallback: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;
        if (fallback === next) fallback = next === 'de' ? 'ru' : 'de';
        setTargetLangState(fallback);
      }
    },
    [sourceLang, targetLang],
  );

  const changeTargetLang = useCallback(
    (next: LanguageCode) => {
      setTargetLangState(next);
      if (next === sourceLang) setSourceLangState('auto');
    },
    [sourceLang],
  );

  const swapLanguages = useCallback(() => {
    const nextTarget: LanguageCode =
      sourceLang === 'auto' ? detectedLang ?? targetLang : sourceLang;
    const safeTarget = nextTarget === targetLang ? (targetLang === 'de' ? 'ru' : 'de') : nextTarget;
    setSourceLangState(targetLang);
    setTargetLangState(safeTarget);

    // Если перевод уже есть, меняем местами и текст — как в Яндекс.Переводчике.
    if (result) {
      const translated =
        result.kind === 'text' ? result.response.translatedText : summarizeCard(result.response.card);
      if (translated) setText(translated);
    }
  }, [detectedLang, result, sourceLang, targetLang]);

  const retry = useCallback(() => {
    void run(text, sourceLang, targetLang);
  }, [run, text, sourceLang, targetLang]);

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    requestRef.current += 1;
    setText('');
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  const applyIncoming = useCallback(
    (value: string, source: SourceLanguage, target: LanguageCode) => {
      setSourceLangState(source);
      setTargetLangState(target);
      setText(value);
    },
    [],
  );

  return {
    text,
    setText,
    sourceLang,
    targetLang,
    result,
    loading,
    error,
    detectedLang,
    historyId,
    setSourceLang: changeSourceLang,
    setTargetLang: changeTargetLang,
    swapLanguages,
    retry,
    clearAll,
    applyIncoming,
  };
}

export type { HistoryItem };
