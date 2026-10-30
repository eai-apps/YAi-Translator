/** POST /api/check — проверка немецкого текста с объяснением каждой ошибки. */
import type { CheckResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireText, requireUiLanguage } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { errorResponse, getClientIp, getUiLanguage, getUserKeys, jsonResponse, readJsonBody } from '../_lib/http';
import { createLimitGuard } from '../_lib/usage';
import { buildCheckPrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { validateCheck } from '../_lib/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const checkUiLang = requireUiLanguage(body.uiLang ?? uiLang);

    const env = context.env;
    const userKeys = getUserKeys(context.request);

    const cacheKey = await buildCacheKey({ kind: 'check', text, sourceLang: 'auto', uiLang: checkUiLang });
    const cached = await readCache<CheckResponse>(env, cacheKey);
    if (cached) return jsonResponse({ ...cached, cached: true });

    // Дневной лимит считается, только когда дело доходит до общих ключей сайта.
    const limitGuard = createLimitGuard(env, getClientIp(context.request));

    const prompt = buildCheckPrompt({ text, uiLang: checkUiLang });
    const { data, provider } = await runJsonTask({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateCheck,
    });

    const result: CheckResponse = { ...data, provider, cached: false };
    await writeCache(env, cacheKey, 'check', result);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
