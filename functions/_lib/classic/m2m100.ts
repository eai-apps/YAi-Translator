/**
 * M2M100 — открытая модель машинного перевода (Meta) внутри Cloudflare Workers AI.
 * Это не чат-ИИ, а обычный переводчик: бесплатно в пределах дневного лимита Workers AI.
 */
import { CLASSIC } from '../config';
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

export const m2m100Translator: ClassicTranslator = {
  id: 'm2m100',
  supportsAutoDetect: false,
  isConfigured: (env) => Boolean(env.AI),

  async translate({ env, text, sourceLang, targetLang, signal }) {
    if (!env.AI || sourceLang === 'auto') return null;
    const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, CLASSIC.timeoutMs);
    try {
      const aborted = new Promise<never>((_, reject) => {
        timeoutSignal.addEventListener('abort', () => reject(new Error('M2M100 aborted')), { once: true });
      });
      const result = (await Promise.race([
        env.AI.run(CLASSIC.m2m100Model, { text, source_lang: sourceLang, target_lang: targetLang }),
        aborted,
      ])) as { translated_text?: string; response?: string } | null;
      const translated = (result?.translated_text ?? result?.response ?? '').trim();
      return translated ? { text: translated, detectedLang: null } : null;
    } catch (error) {
      console.warn('M2M100 не справился:', error instanceof Error ? error.message : error);
      return null;
    } finally {
      clear();
    }
  },
};
