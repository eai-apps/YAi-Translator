/** GET /api/grammar/topics — список тем справочника (без текста) и языки справочника. */
import type { GrammarTopicsResponse, LanguageCode } from '../../../shared/types';
import { GRAMMAR } from '../../_lib/config';
import type { Env } from '../../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../../_lib/http';
import { listTopics, toSummary } from '../../_lib/grammar/store';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const rows = await listTopics(context.env, GRAMMAR.lang);
    const body: GrammarTopicsResponse = {
      items: rows.map(toSummary),
      // Сейчас справочник только немецкий; новые языки появятся строкой в списке тем.
      langs: rows.length > 0 ? [GRAMMAR.lang as LanguageCode] : [],
    };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
