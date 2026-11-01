/**
 * Lingva Translate — открытый сервис перевода (AGPL).
 * Переводит через публичные инстансы с таймаутом 4 секунды.
 */
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.lunar.icu',
];

const TIMEOUT_MS = 4_000;

interface LingvaResponse {
  translation?: string;
  error?: string;
}

export const lingvaTranslator: ClassicTranslator = {
  id: 'lingva',
  supportsAutoDetect: true,
  isConfigured: () => true,

  async translate({ text, sourceLang, targetLang, signal }) {
    const encoded = encodeURIComponent(text);
    const from = sourceLang === 'auto' ? 'auto' : sourceLang;

    const deadline = Date.now() + TIMEOUT_MS;
    for (const baseUrl of LINGVA_INSTANCES) {
      if (Date.now() >= deadline || signal.aborted) break;
      const url = `${baseUrl}/api/v1/${from}/${targetLang}/${encoded}`;
      const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, Math.max(1, deadline - Date.now()));

      try {
        const response = await fetch(url, {
          signal: timeoutSignal,
          headers: {
            'User-Agent': 'YAi-Translator/0.20 (+https://yai-translator.pages.dev/about)',
            Accept: 'application/json',
          },
        });

        if (!response.ok) continue;

        const data = (await response.json().catch(() => ({}))) as LingvaResponse;
        const translated = data.translation?.trim();
        if (translated && !data.error) {
          return { text: translated, detectedLang: null };
        }
      } catch {
        // Пробуем следующий инстанс
      } finally {
        clear();
      }
    }

    return null;
  },
};
