/**
 * POST /api/compare — один и тот же текст во всех подключённых обычных переводчиках сразу,
 * чтобы пользователь сравнил варианты. ИИ здесь не участвует.
 */
import { CLASSIC_PROVIDERS } from '../../shared/types';
import type { CompareItem, CompareResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { isClassicConfigured, translateClassic } from '../_lib/classic';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);
    if (sourceLang !== 'auto' && sourceLang === targetLang) throw new ApiError('VALIDATION', 400);

    const env = context.env;
    const cacheKey = await buildCacheKey({ kind: 'translate', text: `compare|${text}`, sourceLang, targetLang });
    const cached = await readCache<CompareResponse>(env, cacheKey);
    if (cached) return jsonResponse(cached);

    const providers = CLASSIC_PROVIDERS.filter((id) => isClassicConfigured(env, id));
    const items: CompareItem[] = await Promise.all(
      providers.map(async (provider) => {
        const result = await translateClassic(
          { env, text, sourceLang, targetLang, signal: context.request.signal },
          [provider],
        );
        return { provider, text: result?.text ?? null };
      }),
    );

    const response: CompareResponse = { items };
    // Кэшируем, только если ответили все — иначе через минуту можно попробовать снова.
    if (items.every((item) => item.text)) await writeCache(env, cacheKey, 'translate', response);
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
