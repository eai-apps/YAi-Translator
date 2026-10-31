/**
 * Синхронизация завершённых переводов с адресной строкой браузера (/?q=...&from=...&to=...):
 * - Первый перевод — replaceState, следующие — pushState (не чаще одного раза в 1.5 с при смене текста).
 * - Тексты длиннее 500 символов в URL не пишутся.
 * - Кнопки «Назад/Вперёд» браузера и Android переключают предыдущий/следующий перевод.
 * - Открытие ссылки с ?q= сразу запускает перевод.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { LanguageCode, SourceLanguage, TranslateResponse } from '../../shared/types';
import { isLanguageCode } from '../../shared/languages';
import { initialSourceLanguage, readTranslateSettings } from '../lib/translateSettings';

interface UseTranslationUrlSyncOptions {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  result: TranslateResponse | null;
  loading: boolean;
  error: unknown;
  applyIncoming: (value: string, source: SourceLanguage, target: LanguageCode) => void;
  clearAll: () => void;
}

export function useTranslationUrlSync({
  text,
  sourceLang,
  targetLang,
  result,
  loading,
  error,
  applyIncoming,
  clearAll,
}: UseTranslationUrlSyncOptions) {
  const isFirstRef = useRef(true);
  const lastUrlRef = useRef('');
  const lastPushTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const applyRef = useRef(applyIncoming);
  applyRef.current = applyIncoming;
  const clearRef = useRef(clearAll);
  clearRef.current = clearAll;
  const textRef = useRef(text);
  textRef.current = text;
  const location = useLocation();

  // 1. Чтение ?q= из адреса: при открытии, по «Назад/Вперёд» (роутер ловит popstate)
  // и при переходе внутри приложения (например, текст из меню Android).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? params.get('text');
    // Адрес уже соответствует экрану — после перевода не добавлять новую запись в историю.
    lastUrlRef.current = `${window.location.pathname}${window.location.search}`;

    if (q) {
      if (isFirstRef.current) isFirstRef.current = false;
      const fromParam =
        params.get('from') ??
        (readTranslateSettings().detectLanguage ? 'auto' : initialSourceLanguage(false));
      const toParam = params.get('to') ?? 'de';
      const src: SourceLanguage =
        fromParam === 'auto' || isLanguageCode(fromParam) ? fromParam : 'auto';
      const tgt: LanguageCode = isLanguageCode(toParam) ? toParam : 'de';
      if (q !== textRef.current) applyRef.current(q, src, tgt);
    } else if (window.location.pathname === '/' && textRef.current && !isFirstRef.current) {
      clearRef.current();
    }
  }, [location.key, location.search]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // 2. Обновление URL при успешном завершении перевода
  useEffect(() => {
    if (loading || error || !result) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) return;

    const nextSearch = `?q=${encodeURIComponent(trimmed)}&from=${sourceLang}&to=${targetLang}`;
    const nextUrl = `${window.location.pathname}${nextSearch}`;
    if (nextUrl === lastUrlRef.current) return;

    const updateHistory = () => {
      const now = Date.now();
      const currentStep = ((window.history.state as { step?: number } | null)?.step ?? 0);

      const current = new URLSearchParams(window.location.search);
      const sameText = (current.get('q') ?? current.get('text') ?? '').trim() === trimmed;
      const prevState = (window.history.state ?? {}) as Record<string, unknown>;
      if (isFirstRef.current || sameText) {
        window.history.replaceState({ ...prevState, yaiTranslate: true, step: currentStep }, '', nextUrl);
        isFirstRef.current = false;
      } else {
        window.history.pushState({ ...prevState, yaiTranslate: true, step: currentStep + 1 }, '', nextUrl);
      }

      lastUrlRef.current = nextUrl;
      lastPushTimeRef.current = now;
    };

    const elapsed = Date.now() - lastPushTimeRef.current;
    if (timerRef.current) window.clearTimeout(timerRef.current);

    if (isFirstRef.current || elapsed >= 1500) {
      updateHistory();
    } else {
      timerRef.current = window.setTimeout(updateHistory, 1500 - elapsed);
    }
  }, [text, sourceLang, targetLang, result, loading, error]);
}
