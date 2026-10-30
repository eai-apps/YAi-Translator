/**
 * Microsoft Translator (Azure, бесплатный тариф F0 — 2 млн символов в месяц).
 * Включается, если заданы MICROSOFT_TRANSLATOR_KEY (+ _2 … _5 или ключ из админки)
 * и регион MICROSOFT_TRANSLATOR_REGION (у ключей из админки регион хранится вместе с ключом).
 */
import { isLanguageCode } from '../../../shared/languages';
import { CLASSIC } from '../config';
import { usableKeys } from '../keystate';
import { markExhausted, markInvalid, markUsed } from '../keystate';
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
    const keys = await usableKeys(env, 'microsoft');
    if (keys.length === 0) return null;

    const url = new URL(CLASSIC.microsoftUrl);
    url.searchParams.set('api-version', '3.0');
    url.searchParams.set('to', targetLang);
    if (sourceLang !== 'auto') url.searchParams.set('from', sourceLang);

    for (const key of keys) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': key.key,
      };
      const region = key.region ?? env.MICROSOFT_TRANSLATOR_REGION;
      if (region) headers['Ocp-Apim-Subscription-Region'] = region;

      const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, CLASSIC.timeoutMs);
      try {
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers,
          body: JSON.stringify([{ Text: text }]),
          signal: timeoutSignal,
        });
        if (!response.ok) {
          const note = `Microsoft Translator ${response.status}`;
          console.warn(note);
          // 401/403 — неверный ключ; 429 — исчерпан бесплатный лимит.
          if (response.status === 401 || response.status === 403) await markInvalid(env, 'microsoft', key.id, note);
          else if (response.status === 429) await markExhausted(env, 'microsoft', key.id, note);
          continue;
        }
        const data = (await response.json().catch(() => [])) as MicrosoftResponse;
        const translated = data[0]?.translations?.[0]?.text?.trim();
        if (!translated) continue;
        void markUsed(env, 'microsoft', key.id);
        const detected = data[0]?.detectedLanguage?.language ?? null;
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
