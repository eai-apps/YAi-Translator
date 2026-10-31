/**
 * Движок всплывающего окна темы (версия 0.6.0).
 * Открыта одна тема; уже показанные темы берутся из кэша, повторный запрос не отправляется.
 */
import { useCallback, useRef, useState } from 'react';
import type { GrammarTopicResponse, GrammarTopicSummary } from '../../../shared/types';
import { api } from '../../api/client';
import { toTranslatorError } from '../../lib/errors';
import type { TranslatorError } from '../../lib/errors';

export interface GrammarPopupState {
  slug: string | null;
  loading: boolean;
  data: GrammarTopicResponse | null;
  error: TranslatorError | null;
}

interface TopicsSource {
  data: { items: GrammarTopicSummary[] } | null;
  loading: boolean;
  reload: () => void;
}

/** Сколько раз спрашивать сервер, пока он составляет текст темы. */
const WAIT_ATTEMPTS = 4;
/** Пауза между попытками: сервер держит блокировку до 2 минут, поэтому ждём с запасом. */
const WAIT_DELAY_MS = 3_000;

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export function useGrammarPopupState(topics: TopicsSource, uiLanguage: string = 'ru') {
  const [state, setState] = useState<GrammarPopupState>({ slug: null, loading: false, data: null, error: null });
  const abortRef = useRef<AbortController | null>(null);
  // Уже показанные темы: повторное открытие не отправляет запрос.
  const cacheRef = useRef<Record<string, GrammarTopicResponse>>({});

  const load = useCallback(
    async (slug: string) => {
      const known = cacheRef.current[slug];
      if (known?.body) {
        setState({ slug, loading: false, data: known, error: null });
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ slug, loading: true, data: null, error: null });

      let lastError: unknown = null;
      for (let attempt = 0; attempt < WAIT_ATTEMPTS; attempt += 1) {
        if (attempt > 0) await delay(WAIT_DELAY_MS, controller.signal);
        if (controller.signal.aborted) return;
        try {
          const data = await api.grammarTopic(slug, uiLanguage, controller.signal);
          if (controller.signal.aborted) return;
          // Пока другой посетитель генерирует ту же тему, сервер отвечает «попробуйте позже» —
          // ждём и спрашиваем ещё раз, не показывая ошибку.
          if (!data.body && data.offlineReason === 'error' && attempt < WAIT_ATTEMPTS - 1) continue;
          cacheRef.current[slug] = data;
          setState({ slug, loading: false, data, error: null });
          return;
        } catch (caught) {
          if (controller.signal.aborted) return;
          lastError = caught;
          break;
        }
      }

      if (controller.signal.aborted) return;
      setState({ slug, loading: false, data: null, error: toTranslatorError(lastError, 'grammar.loadError') });
    },
    [uiLanguage],
  );

  const open = useCallback(
    (slug: string) => {
      // Заголовок окна берётся из списка тем — если его ещё нет, подгружаем.
      if (!topics.data && !topics.loading) topics.reload();
      void load(slug);
    },
    [load, topics],
  );

  /** «Повторить позже»: просим тему снова — сервер попробует ИИ ещё раз. */
  const retry = useCallback(() => {
    if (!state.slug) return;
    delete cacheRef.current[state.slug];
    void load(state.slug);
  }, [load, state.slug]);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setState({ slug: null, loading: false, data: null, error: null });
  }, []);

  const summary = state.slug ? (topics.data?.items.find((item) => item.slug === state.slug) ?? null) : null;

  return { ...state, summary, open, close, retry };
}
