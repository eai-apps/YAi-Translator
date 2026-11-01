/**
 * Apertium — открытая система машинного перевода (GPL).
 * Бесплатный API без ключа (https://apertium.org/apy/).
 * Таймаут 4 секунды.
 */
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

const APERTIUM_URL = 'https://apertium.org/apy/translate';
const TIMEOUT_MS = 4_000;

interface ApertiumResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
  responseDetails?: string | null;
}

export const apertiumTranslator: ClassicTranslator = {
  id: 'apertium',
  supportsAutoDetect: false,
  isConfigured: () => true,

  async translate({ text, sourceLang, targetLang, signal }) {
    if (sourceLang === 'auto') return null;

    const url = new URL(APERTIUM_URL);
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', `${sourceLang}|${targetLang}`);

    const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), {
        signal: timeoutSignal,
        headers: {
          'User-Agent': 'YAi-Translator/0.20 (+https://yai-translator.pages.dev/about)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) return null;

      const data = (await response.json().catch(() => ({}))) as ApertiumResponse;
      if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
        return null;
      }

      if (/[*@][\p{L}]/u.test(data.responseData.translatedText)) return null;
      // Очистка спецсимволов Apertium для неизвестных слов (*word, @word)
      const cleaned = data.responseData.translatedText.replace(/[*@]([A-Za-zА-Яа-я0-9äöüÄÖÜß]+)/g, '$1').trim();
      if (!cleaned) return null;

      return { text: cleaned, detectedLang: null };
    } catch {
      return null;
    } finally {
      clear();
    }
  },
};
