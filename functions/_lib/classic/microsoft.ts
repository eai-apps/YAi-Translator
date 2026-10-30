/**
 * Microsoft Translator (Azure, бесплатный тариф F0 — 2 млн символов в месяц).
 * Включается, только если в Cloudflare заданы MICROSOFT_TRANSLATOR_KEY и MICROSOFT_TRANSLATOR_REGION.
 */
import { isLanguageCode } from '../../../shared/languages';
import { CLASSIC } from '../config';
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

type MicrosoftResponse = Array<{
  detectedLanguage?: { language?: string };
  translations?: Array<{ text?: string }>;
}>;

export const microsoftTranslator: ClassicTranslator = {
  id: 'microsoft',
  supportsAutoDetect: true,
  isConfigured: (env) => Boolean(env.MICROSOFT_TRANSLATOR_KEY),

  async translate({ env, text, sourceLang, targetLang, signal }) {
    if (!env.MICROSOFT_TRANSLATOR_KEY) return null;
    const url = new URL(CLASSIC.microsoftUrl);
    url.searchParams.set('api-version', '3.0');
    url.searchParams.set('to', targetLang);
    if (sourceLang !== 'auto') url.searchParams.set('from', sourceLang);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': env.MICROSOFT_TRANSLATOR_KEY,
    };
    if (env.MICROSOFT_TRANSLATOR_REGION) {
      headers['Ocp-Apim-Subscription-Region'] = env.MICROSOFT_TRANSLATOR_REGION;
    }

    const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, CLASSIC.timeoutMs);
    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify([{ Text: text }]),
        signal: timeoutSignal,
      });
      if (!response.ok) {
        console.warn(`Microsoft Translator ${response.status}`);
        return null;
      }
      const data = (await response.json().catch(() => [])) as MicrosoftResponse;
      const translated = data[0]?.translations?.[0]?.text?.trim();
      if (!translated) return null;
      const detected = data[0]?.detectedLanguage?.language ?? null;
      return { text: translated, detectedLang: isLanguageCode(detected) ? detected : null };
    } catch {
      return null;
    } finally {
      clear();
    }
  },
};
