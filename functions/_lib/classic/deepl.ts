/** DeepL в общей цепочке обычных переводчиков (сам вызов — в providers/deepl.ts). */
import { translateWithDeepL } from '../providers/deepl';
import type { ClassicTranslator } from './types';

export const deeplTranslator: ClassicTranslator = {
  id: 'deepl',
  supportsAutoDetect: true,
  isConfigured: (env) => Boolean(env.DEEPL_API_KEY),

  async translate({ env, text, sourceLang, targetLang, signal }) {
    const translated = await translateWithDeepL(env, text, sourceLang, targetLang, signal);
    return translated ? { text: translated, detectedLang: null } : null;
  },
};
