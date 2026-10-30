/**
 * Хук блока «Как переводят другие»: загрузка через /api/compare, повтор,
 * раскрытие для длинного текста и выбор варианта как основного перевода.
 *
 * Запрос уходит один раз на «текст + языки + основной сервис»: сменился сервис —
 * блок перезагружается, чтобы основной перевод не повторялся в списке.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompareResponse, LanguageCode, ProviderId, SourceLanguage } from '../../shared/types';
import { api } from '../api/client';
import { shouldAutoLoad } from '../components/translate/OthersPanel';

interface Options {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  /** Сервис основного перевода. */
  provider: ProviderId | null;
  /** Настройка «Показывать другие переводчики автоматически». */
  autoEnabled: boolean;
}

export function useOthers({ text, sourceLang, targetLang, provider, autoEnabled }: Options) {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Пользователь нажал «Показать» у длинного текста. */
  const [manual, setManual] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (exclude: ProviderId | null) => {
      const value = text.trim();
      if (!value) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setFailed(false);
      try {
        const response = await api.compare(
          { text: value, sourceLang, targetLang, ...(exclude ? { exclude } : {}) },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setData(response);
      } catch {
        if (controller.signal.aborted) return;
        setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [text, sourceLang, targetLang],
  );

  // Новый текст, языки или другой движок — начинаем заново.
  useEffect(() => {
    setManual(false);
    setData(null);
    setFailed(false);
    abortRef.current?.abort();

    if (shouldAutoLoad(text.trim().length, autoEnabled)) void load(provider);
    return () => abortRef.current?.abort();
  }, [text, sourceLang, targetLang, provider, autoEnabled, load]);

  const expanded = manual || shouldAutoLoad(text.trim().length, autoEnabled);

  const expand = useCallback(() => {
    setManual(true);
    if (!data && !loading) void load(provider);
  }, [data, loading, load, provider]);

  const collapse = useCallback(() => {
    setManual(false);
    abortRef.current?.abort();
    // Короткий текст загружается сам — сворачивание только скрывает то, что уже есть.
    if (!shouldAutoLoad(text.trim().length, autoEnabled)) setData(null);
  }, [text, autoEnabled]);

  const retry = useCallback(() => {
    setData(null);
    void load(provider);
  }, [load, provider]);

  return { data, loading, failed, expanded, expand, collapse, retry };
}
