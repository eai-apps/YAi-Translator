/**
 * Нативное системное окно «Поделиться».
 * Использует @capacitor/share в приложении, navigator.share в браузере,
 * либо fallback на копирование в буфер обмена.
 */
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { writeClipboardText } from './nativeClipboard';

export async function shareText(options: {
  title?: string;
  text: string;
  url?: string;
  dialogTitle?: string;
}): Promise<'shared' | 'copied' | 'dismissed'> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle ?? options.title,
      });
      return 'shared';
    } catch {
      return 'dismissed';
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return 'shared';
    } catch {
      return 'dismissed';
    }
  }

  // Fallback: просто копируем текст
  const copied = await writeClipboardText(options.text);
  return copied ? 'copied' : 'dismissed';
}
