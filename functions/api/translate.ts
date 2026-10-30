/** POST /api/translate — перевод фразы или текста с альтернативами в разных стилях. */
import type { TranslateResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { ApiError, errorResponse, getClientIp, getUiLanguage, getUserKeys, jsonResponse, readJsonBody } from '../_lib/http';
import { createLimitGuard } from '../_lib/usage';
import { buildTranslatePrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { translateWithDeepL } from '../_lib/providers/deepl';
import { validateTranslate } from '../_lib/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      throw new ApiError('VALIDATION', 400);
    }

    const env = context.env;
    const userKeys = getUserKeys(context.request);

    // 1. Кэш: одинаковый запрос не тратит бесплатные лимиты.
    const cacheKey = await buildCacheKey({ kind: 'translate', text, sourceLang, targetLang, uiLang });
    const cached = await readCache<TranslateResponse>(env, cacheKey);
    if (cached) return jsonResponse({ ...cached, cached: true });

    // 2. Дневной лимит — только для запросов на общих ключах сайта.
    // Дневной лимит считается, только когда дело доходит до общих ключей сайта.
    const limitGuard = createLimitGuard(env, getClientIp(context.request));

    const prompt = buildTranslatePrompt({ text, sourceLang, targetLang, uiLang });
    let result: TranslateResponse | null = null;

    // 3. Ключ пользователя, затем общие ключи Gemini и Groq.
    try {
      const { data, provider } = await runJsonTask({
        env,
        prompt,
        userKeys,
        signal: context.request.signal,
        beforeShared: limitGuard,
      validate: validateTranslate,
        only: ['gemini', 'groq'],
      });
      result = { ...data, provider, cached: false };
    } catch {
      // Ниже попробуем DeepL, затем Workers AI.
    }

    // 4. DeepL — только основной перевод, без альтернатив.
    if (!result) {
      await limitGuard();
      const deepLText = await translateWithDeepL(env, text, sourceLang, targetLang, context.request.signal);
      if (deepLText) {
        result = {
          translatedText: deepLText,
          alternatives: [],
          detectedLang: null,
          provider: 'deepl',
          cached: false,
        };
      }
    }

    // 5. Workers AI — последний запасной вариант.
    if (!result) {
      try {
        const { data, provider } = await runJsonTask({
          env,
          prompt,
          userKeys: {},
          signal: context.request.signal,
          beforeShared: limitGuard,
      validate: validateTranslate,
          only: ['workersai'],
        });
        result = { ...data, provider, cached: false };
      } catch {
        throw new ApiError('LIMIT_REACHED', 429);
      }
    }

    await writeCache(env, cacheKey, 'translate', result);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
