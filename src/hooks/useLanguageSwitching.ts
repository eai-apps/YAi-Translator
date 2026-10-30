/**
 * Выбор языков на экране «Перевод» и определение языка ответа.
 * Вынесено из useTranslator, чтобы файл оставался коротким и читаемым.
 */
import { useCallback, useMemo } from 'react';
import type { LanguageCode, SourceLanguage, TranslateResponse } from '../../shared/types';

/** Язык «определён» на экране: из ответа перевода, иначе из карточки слова. */
export function useCardLanguage(
  result: TranslateResponse | null,
  word: { data: { card: { language: LanguageCode } } | null },
): LanguageCode | null {
  return useMemo<LanguageCode | null>(() => {
    if (result?.detectedLang) return result.detectedLang;
    return word.data?.card.language ?? null;
  }, [result, word.data]);
}

interface LanguageState {
  sourceLang: SourceLanguage;
  setSourceLangState: (value: SourceLanguage) => void;
  targetLang: LanguageCode;
  setTargetLangState: (value: LanguageCode) => void;
  detectedLang: LanguageCode | null;
  result: TranslateResponse | null;
  setText: (value: string) => void;
}

/** Смена языков: если языки совпали, второй подставляется сам; «⇄» меняет местами и текст. */
export function useLanguageSwitching(state: LanguageState) {
  const { sourceLang, setSourceLangState, targetLang, setTargetLangState, detectedLang, result, setText } = state;

  const changeSourceLang = useCallback(
    (next: SourceLanguage) => {
      setSourceLangState(next);
      if (next !== 'auto' && next === targetLang) {
        let fallback: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;
        if (fallback === next) fallback = next === 'de' ? 'ru' : 'de';
        setTargetLangState(fallback);
      }
    },
    [sourceLang, targetLang, setSourceLangState, setTargetLangState],
  );

  const changeTargetLang = useCallback(
    (next: LanguageCode) => {
      setTargetLangState(next);
      if (next === sourceLang) setSourceLangState('auto');
    },
    [sourceLang, setSourceLangState, setTargetLangState],
  );

  const swapLanguages = useCallback(() => {
    const nextTarget: LanguageCode = sourceLang === 'auto' ? detectedLang ?? targetLang : sourceLang;
    const safeTarget = nextTarget === targetLang ? (targetLang === 'de' ? 'ru' : 'de') : nextTarget;
    setSourceLangState(targetLang);
    setTargetLangState(safeTarget);
    // Если перевод уже есть, меняем местами и текст — как в Яндекс.Переводчике.
    if (result?.translatedText) setText(result.translatedText);
  }, [detectedLang, result, setText, sourceLang, targetLang, setSourceLangState, setTargetLangState]);

  return { changeSourceLang, changeTargetLang, swapLanguages };
}
