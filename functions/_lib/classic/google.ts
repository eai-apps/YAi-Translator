/**
 * Google Cloud Translation (Basic v2, 500 000 символов в месяц бесплатно).
 * Включается, если задан GOOGLE_TRANSLATE_KEY (или _2 … _5, или ключ из админки).
 * Важно: Google требует привязать карту к проекту Google Cloud даже для бесплатного объёма.
 */
import { isLanguageCode } from '../../../shared/languages';
import { CLASSIC } from '../config';
import { usableKeys } from '../keystate';
import { markExhausted, markInvalid, markUsed } from '../keystate';
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

interface GoogleResponse {
  data?: { translations?: Array<{ translatedText?: string; detectedSourceLanguage?: string }> };
}

/** Google возвращает HTML-сущности (&#39; и т.п.) — превращаем их обратно в символы. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export const googleTranslator: ClassicTranslator = {
  id: 'google',
  supportsAutoDetect: true,
  isConfigured: (env) => Boolean(env.GOOGLE_TRANSLATE_KEY),

  async translate({ env, text, sourceLang, targetLang, signal }) {
    const keys = await usableKeys(env, 'google');
    const body = JSON.stringify({
      q: text,
      target: targetLang,
      format: 'text',
      ...(sourceLang !== 'auto' ? { source: sourceLang } : {}),
    });

    for (const key of keys) {
      const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, CLASSIC.timeoutMs);
      try {
        const response = await fetch(CLASSIC.googleUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.key },
          body,
          signal: timeoutSignal,
        });
        if (!response.ok) {
          const note = `Google Translate ${response.status}`;
          console.warn(note);
          if (response.status === 403) await markInvalid(env, 'google', key.id, note);
          else if (response.status === 429) await markExhausted(env, 'google', key.id, note);
          continue;
        }
        const data = (await response.json().catch(() => ({}))) as GoogleResponse;
        const item = data.data?.translations?.[0];
        const translated = item?.translatedText ? decodeEntities(item.translatedText).trim() : '';
        if (!translated) continue;
        void markUsed(env, 'google', key.id);
        const detected = item?.detectedSourceLanguage ?? null;
        return { text: translated, detectedLang: isLanguageCode(detected) ? detected : null };
      } catch {
        // Сеть или таймаут — пробуем следующий ключ.
      } finally {
        clear();
      }
    }
    return null;
  },
};
