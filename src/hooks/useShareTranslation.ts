/**
 * «Поделиться» переводом (этап 8): на телефоне — системное окно, иначе — копирование в буфер.
 * Вынесено из страницы перевода, чтобы она оставалась короткой.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Есть ли системное окно «Поделиться» (обычно только на телефоне). */
export function useShareSupport(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function useShareTranslation(sourceText: string, translation: string) {
  const { t } = useTranslation();
  const supported = useShareSupport();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  // Таймер подтверждения «Скопировано» не должен жить после ухода со страницы.
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const share = useCallback(async () => {
    if (!translation) return;
    const combined = sourceText.trim() ? `${sourceText.trim()}\n→ ${translation}` : translation;
    try {
      if (supported) {
        await navigator.share({ title: t('common.appName'), text: combined });
        return;
      }
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Окно закрыли или браузер запретил — ничего не показываем.
    }
  }, [sourceText, supported, t, translation]);

  return { share, supported, copied };
}
