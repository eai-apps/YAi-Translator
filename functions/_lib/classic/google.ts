/**
 * Google Cloud Translation (Basic v2, 500 000 символов в месяц бесплатно).
 * Включается, только если в Cloudflare задан GOOGLE_TRANSLATE_KEY.
 * Важно: Google требует привязать карту к проекту Google Cloud даже для бесплатного объёма.
 */
import { isLanguageCode } from '../../../shared/languages';
import { CLASSIC } from '../config';
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
    if (!env.GOOGLE_TRANSLATE_KEY) return null;
    const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, CLASSIC.timeoutMs);
    try {
      const response = await fetch(CLASSIC.googleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GOOGLE_TRANSLATE_KEY },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: 'text',
          ...(sourceLang !== 'auto' ? { source: sourceLang } : {}),
        }),
        signal: timeoutSignal,
      });
      if (!response.ok) {
        console.warn(`Google Translate ${response.status}`);
        return null;
      }
      const data = (await response.json().catch(() => ({}))) as GoogleResponse;
      const item = data.data?.translations?.[0];
      const translated = item?.translatedText ? decodeEntities(item.translatedText).trim() : '';
      if (!translated) return null;
      const detected = item?.detectedSourceLanguage ?? null;
      return { text: translated, detectedLang: isLanguageCode(detected) ? detected : null };
    } catch {
      return null;
    } finally {
      clear();
    }
  },
};
