/**
 * Действия с переводом на экране «Перевод» (этап 8Б): «Поделиться» и переходы по нажатым словам.
 * Вынесено из TranslatePage.tsx, чтобы страница осталась короткой и её было легко проверять.
 */
import { useEffect, useRef, useState } from 'react';
import type { LanguageCode } from '../../shared/types';

interface Picker {
  /** Нажатое слово из карточки становится новым запросом (язык ввода определится сам). */
  setText: (value: string) => void;
  setSourceLang: (language: 'auto') => void;
  setTargetLang: (language: LanguageCode) => void;
}

export function useTranslationActions(picker: Picker) {
  const { setText, setSourceLang, setTargetLang } = picker;
  /** «Поделиться» без navigator.share — короткое подтверждение «Скопировано». */
  const [shareCopied, setShareCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  // Уходим со страницы — таймер подтверждения больше не нужен.
  useEffect(
    () => () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  // Нажатое слово из карточки: поле ввода наверху, страница прокручивается к нему.
  const pickText = (value: string) => {
    setSourceLang('auto');
    setText(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Нажатие на перевод («получать»): слово встаёт в поле ввода, цель — язык этого перевода,
   * источник остаётся «Определить»: язык ввода определяется сам. Старый выбор сбрасывается —
   * если он совпал с целью, перевод шёл бы «перевод в себя» и сервер отклонил бы запрос.
   */
  const pickTranslation = (value: string, lang: LanguageCode) => {
    setSourceLang('auto');
    setTargetLang(lang);
    setText(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Системное окно телефона, без него — перевод кладётся в буфер обмена. */
  const share = async (sourceText: string, translation: string, title: string) => {
    if (!translation) return;
    const combined = sourceText.trim() ? `${sourceText.trim()}\n→ ${translation}` : translation;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text: combined });
        return;
      }
      await navigator.clipboard.writeText(translation);
      setShareCopied(true);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Окно закрыли или браузер запретил — ничего не показываем.
    }
  };

  const shareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  return { pickText, pickTranslation, share, shareSupported, shareCopied };
}
