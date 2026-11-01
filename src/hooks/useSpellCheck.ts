/**
 * Хук автоматической проверки правописания через LanguageTool (этап 18, версия 0.20.0).
 * Запускается с задержкой 800 мс после окончания ввода; при ошибке/лимите тихо выключается.
 */
import { useEffect, useRef, useState } from 'react';
import type { CheckResponse, Correction, SourceLanguage, UiLanguage } from '../../shared/types';
import { api } from '../api/client';

interface UseSpellCheckOptions {
  text: string;
  sourceLang: SourceLanguage;
  uiLanguage: UiLanguage;
  enabled?: boolean;
}

export function useSpellCheck({ text, sourceLang, uiLanguage, enabled = true }: UseSpellCheckOptions) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [correctedText, setCorrectedText] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();

    setCorrections([]);
    setCorrectedText('');
    setChecking(false);
    const trimmed = text.trim();
    if (!enabled || trimmed.length < 3 || trimmed.length > 3000) {
      setCorrections([]);
      setCorrectedText('');
      setChecking(false);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      setChecking(true);

      api
        .check(
          {
            text,
            lang: sourceLang === 'auto' ? undefined : sourceLang,
            sourceLang,
            uiLang: uiLanguage,
          },
          controller.signal,
        )
        .then((res: CheckResponse) => {
          if (controller.signal.aborted) return;
          setCorrections(res.corrections ?? []);
          setCorrectedText(res.correctedText ?? trimmed);
        })
        .catch(() => {
          // При ошибке или превышении частоты тихо отключаем
          if (!controller.signal.aborted) {
            setCorrections([]);
            setCorrectedText('');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setChecking(false);
        });
    }, 800);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [text, sourceLang, uiLanguage, enabled]);

  const clearCorrections = () => {
    setCorrections([]);
    setCorrectedText('');
  };

  return {
    corrections,
    correctedText,
    checking,
    clearCorrections,
  };
}
