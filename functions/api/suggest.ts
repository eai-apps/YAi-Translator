/**
 * GET /api/suggest?q=hol&lang=de — подсказки при наборе одного слова (этап 8).
 * Источник: Wiktionary opensearch; ответ кэшируется в D1 на 30 дней.
 * Параметр count=1 добавляет cachedWords — сколько слов уже лежит в кэше (для настроек, без ИИ).
 */
import type { SuggestResponse } from '../../shared/types';
import { isLanguageCode } from '../../shared/languages';
import type { Env } from '../_lib/env';
import { SUGGEST } from '../_lib/config';
import { ApiError, errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { SUGGEST_MAX_QUERY, countCachedSuggestions, lookupSuggestions } from '../_lib/dict/suggest';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const url = new URL(context.request.url);

    // Только счётчик: приходит из «Проверить офлайн-готовность» в настройках.
    if (url.searchParams.get('count') === '1') {
      const body: SuggestResponse = { items: [], cachedWords: await countCachedSuggestions(context.env) };
      return jsonResponse(body);
    }

    const query = (url.searchParams.get('q') ?? '').trim().slice(0, SUGGEST_MAX_QUERY);
    if (query.length < SUGGEST.minQueryLength) {
      return jsonResponse({ items: [] } satisfies SuggestResponse);
    }

    const langParam = url.searchParams.get('lang') ?? 'de';
    if (!isLanguageCode(langParam)) throw new ApiError('VALIDATION', 400);
    const lang = langParam;

    const items = await lookupSuggestions(context.env, lang, query);
    return jsonResponse({ items } satisfies SuggestResponse);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
