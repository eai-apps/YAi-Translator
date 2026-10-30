/** POST /api/word — карточка слова: значения, артикль, склонение, спряжение, примеры. */
import type { WordResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { LIMITS } from '../_lib/config';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { ApiError, errorResponse, getClientIp, getHeaderKeys, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { buildWordPrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { validateWordCard } from '../_lib/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const word = requireText(body.word, LIMITS.maxWordLength);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      throw new ApiError('VALIDATION', 400);
    }

    const env = context.env;
    // Ключи: заголовки X-User-* важнее, затем ключи из аккаунта (если вошёл).
    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));

    const cacheKey = await buildCacheKey({ kind: 'word', text: word, sourceLang, targetLang, uiLang });
    const cached = await readCache<WordResponse>(env, cacheKey);
    if (cached) return jsonResponse({ ...cached, cached: true });

    // Дневной лимит считается, только когда дело доходит до общих ключей сайта.
    const limitGuard = createLimitGuard(env, getClientIp(context.request));

    const prompt = buildWordPrompt({ word, sourceLang, targetLang, uiLang });
    const { data, provider } = await runJsonTask({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateWordCard,
    });

    const result: WordResponse = { card: data, provider, cached: false };
    await writeCache(env, cacheKey, 'word', result, LIMITS.wordCacheTtlSeconds);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
