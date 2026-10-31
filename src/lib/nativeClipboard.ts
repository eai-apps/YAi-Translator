/**
 * Работа с буфером обмена.
 * В нативном приложении использует @capacitor/clipboard (не зависит от ограничений WebView),
 * в веб-версии — стандартный navigator.clipboard.
 */
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';

export async function readClipboardText(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Clipboard.read();
      return result.value ?? '';
    } catch {
      return '';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }

  return '';
}

export async function writeClipboardText(text: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Clipboard.write({ string: text });
      return true;
    } catch {
      return false;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
