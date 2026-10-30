/**
 * Панели «Разобрать» и «Проверить мой немецкий» на экране «Перевод» (этап 1).
 * Оба запроса идут только по кнопке, отменяются при смене текста и при закрытии панели.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CheckResponse, ExplainResponse, LanguageCode, SourceLanguage, UiLanguage } from '../../shared/types';
import { api } from '../api/client';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';

export interface PanelState<T> {
  open: boolean;
  loading: boolean;
  data: T | null;
  error: TranslatorError | null;
}

function closedPanel<T>(): PanelState<T> {
  return { open: false, loading: false, data: null, error: null };
}

interface Options {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  uiLanguage: UiLanguage;
  /** Лимит исчерпан — нужно открыть окно подключения ключа. */
  onLimitReached: () => void;
}

/** Состояние сразу двух панелей + функции запуска и закрытия. */
export function useExplainAndCheck({ text, sourceLang, targetLang, uiLanguage, onLimitReached }: Options) {
  const { t } = useTranslation();
  const [explain, setExplain] = useState<PanelState<ExplainResponse>>(closedPanel);
  const [check, setCheck] = useState<PanelState<CheckResponse>>(closedPanel);

  const explainAbort = useRef<AbortController | null>(null);
  const checkAbort = useRef<AbortController | null>(null);
  const limitRef = useRef(onLimitReached);
  limitRef.current = onLimitReached;

  // Новый текст — старые разбор и проверка больше не относятся к делу.
  useEffect(() => {
    explainAbort.current?.abort();
    checkAbort.current?.abort();
    setExplain(closedPanel());
    setCheck(closedPanel());
  }, [text, sourceLang, targetLang]);

  useEffect(() => {
    return () => {
      explainAbort.current?.abort();
      checkAbort.current?.abort();
    };
  }, []);

  const runExplain = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    explainAbort.current?.abort();
    const controller = new AbortController();
    explainAbort.current = controller;
    setExplain({ open: true, loading: true, data: null, error: null });

    void (async () => {
      try {
        const data = await api.explain({ text: value, sourceLang, targetLang, uiLang: uiLanguage }, controller.signal);
        if (controller.signal.aborted) return;
        setExplain({ open: true, loading: false, data, error: null });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const error = toTranslatorError(caught, t('errors.unknown'));
        setExplain({ open: true, loading: false, data: null, error });
        if (error.code === 'LIMIT_REACHED') limitRef.current();
      }
    })();
  }, [text, sourceLang, targetLang, uiLanguage, t]);

  const runCheck = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    checkAbort.current?.abort();
    const controller = new AbortController();
    checkAbort.current = controller;
    setCheck({ open: true, loading: true, data: null, error: null });

    void (async () => {
      try {
        const data = await api.check({ text: value, uiLang: uiLanguage }, controller.signal);
        if (controller.signal.aborted) return;
        setCheck({ open: true, loading: false, data, error: null });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const error = toTranslatorError(caught, t('errors.unknown'));
        setCheck({ open: true, loading: false, data: null, error });
        if (error.code === 'LIMIT_REACHED') limitRef.current();
      }
    })();
  }, [text, uiLanguage, t]);

  const closeExplain = useCallback(() => {
    explainAbort.current?.abort();
    setExplain(closedPanel());
  }, []);

  const closeCheck = useCallback(() => {
    checkAbort.current?.abort();
    setCheck(closedPanel());
  }, []);

  return { explain, check, runExplain, runCheck, closeExplain, closeCheck };
}
