/**
 * Список тем справочника (версия 0.6.0).
 * Грузится один раз на всё приложение: и странице /grammar, и всплывающему окну темы
 * нужны названия, поэтому попап открывается сразу, без повторного запроса списка.
 */
import { useCallback, useEffect, useState } from 'react';
import type { GrammarTopicsResponse } from '../../shared/types';
import { api } from '../api/client';

export interface GrammarTopicsState {
  data: GrammarTopicsResponse | null;
  loading: boolean;
  failed: boolean;
  reload: () => void;
}

export function useGrammarTopics(): GrammarTopicsState {
  const [data, setData] = useState<GrammarTopicsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setFailed(false);
    api
      .grammarTopics(controller.signal)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, loading, failed, reload };
}
