/**
 * GET /api/grammar/topic?slug=konjunktiv-2&ui=ru — тема справочника для страницы /grammar и попапа.
 * Текст темы хранится в D1 и составляется ИИ только один раз; если ИИ недоступен,
 * возвращаем название и ссылки на открытые источники, кнопка «Повторить позже» спросит снова.
 */
import type { GrammarTopicResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { errorResponse, getClientIp, getHeaderKeys, getUiLanguage, jsonResponse } from '../../_lib/http';
import { requireUiLanguage } from '../../_lib/request';
import { resolveUserKeys } from '../../_lib/auth/keys';
import { readTopic, requireSlug } from '../../_lib/grammar/store';
import { loadTopicBody, topicResponse } from '../../_lib/grammar/generate';
import { ApiError } from '../../_lib/http';
import { ENGLISH_GRAMMAR_TOPICS, getEnglishTopicBody, isEnglishGrammarSlug } from '../../../shared/grammarEnglish';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const url = new URL(context.request.url);
    const slug = requireSlug(url.searchParams.get('slug'));
    const answerLang = requireUiLanguage(url.searchParams.get('ui') ?? uiLang);

    // Английские темы справочника (этап 18): готовые тексты, таблицы и тесты без вызова ИИ
    if (isEnglishGrammarSlug(slug)) {
      const seed = ENGLISH_GRAMMAR_TOPICS.find((item) => item.slug === slug);
      const body = getEnglishTopicBody(slug, answerLang);
      if (seed && body) {
        const response: GrammarTopicResponse = {
          slug: seed.slug,
          lang: 'en',
          level: seed.level,
          category: seed.category,
          titleRu: seed.titleRu,
          titleDe: seed.titleDe,
          titleEn: seed.titleEn,
          filled: true,
          updatedAt: Date.now(),
          body,
          source: 'admin',
          offlineReason: null,
          links: body.links || [],
        };
        return jsonResponse(response);
      }
    }

    const env = context.env;
    const row = await readTopic(env, slug);
    if (!row) throw new ApiError('NOT_FOUND', 404);

    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));
    const loaded = await loadTopicBody({
      env,
      row,
      uiLang: answerLang,
      userKeys,
      signal: context.request.signal,
      clientIp: getClientIp(context.request),
    });

    const body: GrammarTopicResponse = topicResponse(row, loaded);
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
