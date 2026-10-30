/**
 * GET /api/resources — полезные бесплатные ресурсы по языкам (без входа и без ключей).
 * Ответ кэшируется в D1 на 10 минут: изменения из админки появляются быстро.
 */
import type { ResourcesResponse } from '../../shared/types';
import { LANGUAGE_CODES } from '../../shared/languages';
import { readCache, writeCache } from '../_lib/cache';
import { RESOURCES } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { listResources, orderLanguages } from '../_lib/resources/store';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    // Кэш считается рабочим, только если в нём есть ссылки: пустой ответ записывать незачем.
    const cached = await readCache<ResourcesResponse>(env, RESOURCES.cacheKey);
    if (cached && Array.isArray(cached.items) && cached.items.length > 0) return jsonResponse(cached);

    const items = await listResources(env, true);
    const body: ResourcesResponse = {
      items,
      langs: orderLanguages(
        items.map((item) => item.lang),
        LANGUAGE_CODES,
      ),
    };
    if (items.length > 0) await writeCache(env, RESOURCES.cacheKey, 'resources', body, RESOURCES.cacheTtlSeconds);
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
