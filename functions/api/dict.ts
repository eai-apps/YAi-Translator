/**
 * POST /api/dict {word, sourceLang, targetLang} — карточка слова из настоящих словарей.
 * Работает без ИИ и без ключей. Источники: Wiktionary, OpenThesaurus, Tatoeba, PONS (если есть ключ), DWDS.
 * Результат кэшируется в D1 на 30 дней (OpenThesaurus просит не больше 60 запросов в минуту).
 */
import type { DictResponse, LanguageCode } from '../../shared/types';
import { DICT, LIMITS } from '../_lib/config';
import { readCache, writeCache } from '../_lib/cache';
import { buildDictEntry, dictCacheKey, normalizeDictWord } from '../_lib/dict';
import type { Env } from '../_lib/env';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { requireLanguage, requireSourceLanguage } from '../_lib/request';
import { bump } from '../_lib/stats';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const word = normalizeDictWord(typeof body.word === 'string' ? body.word : '');
    if (!word || word.length > LIMITS.maxWordLength) throw new ApiError('VALIDATION', 400);

    const requestedSource = requireSourceLanguage(body.sourceLang);
    const targetLang: LanguageCode = requireLanguage(body.targetLang);
    const sourceLang: LanguageCode = requestedSource === 'auto' ? (targetLang === 'de' ? 'ru' : 'de') : requestedSource;
    if (sourceLang === targetLang) throw new ApiError('VALIDATION', 400);

    const env = context.env;
    const cacheKey = dictCacheKey(word, sourceLang, targetLang);
    const cached = await readCache<DictResponse['entry']>(env, cacheKey);
    if (cached) {
      void bump(env, ['dict', 'cache_hits']);
      return jsonResponse({ entry: cached, cached: true } satisfies DictResponse);
    }

    const entry = await buildDictEntry(env, word, sourceLang, targetLang, context.request.signal);
    if (!entry) throw new ApiError('WORD_NOT_FOUND', 404);

    await writeCache(env, cacheKey, 'dict', entry, DICT.cacheTtlSeconds);
    void bump(env, ['dict']);
    return jsonResponse({ entry, cached: false } satisfies DictResponse);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
