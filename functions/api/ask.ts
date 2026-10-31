/**
 * POST /api/ask — «Спросить у AI»: учитель грамматики в чате.
 * Ответ кэшируется на 90 дней по нормализованному вопросу: одинаковые вопросы разных
 * людей стоят ИИ один запрос. Личный ключ пользователя идёт первым, общий дневной лимит
 * действует только на общие ключи сайта.
 */
import type { AskResponse } from '../../shared/types';
import { ASK } from '../_lib/config';
import type { Env } from '../_lib/env';
import { readCache, writeCache } from '../_lib/cache';
import {
  ApiError,
  errorResponse,
  getClientIp,
  getHeaderKeys,
  getUiLanguage,
  jsonResponse,
  readJsonBody,
} from '../_lib/http';
import { buildCacheKey, requireUiLanguage } from '../_lib/request';
import { findRequestSession, resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { buildAskPrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { bump } from '../_lib/stats';
import { validateAsk } from '../_lib/validate';
import type { AskCore } from '../_lib/validate';
import { readSetting, SETTINGS_KEYS } from '../_lib/settings';

/** Вопрос: обрезаем пробелы, склеиваем повторы и убираем знак в конце — кэш общий для «…» и «…?». */
export function normalizeQuestion(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const question = raw.replace(/\s+/g, ' ').trim().slice(0, ASK.maxQuestionLength);
  return question.replace(/[?!.]+$/u, '').trim();
}

/** Короткий вопрос из трёх слов осмыслен, из двух букв — нет. */
const MIN_QUESTION_LENGTH = 3;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const question = normalizeQuestion(body.question);
    if (question.length < MIN_QUESTION_LENGTH) throw new ApiError('VALIDATION', 400);
    const answerLang = requireUiLanguage(body.uiLang ?? uiLang);

    const aiModel =
      typeof body.aiModel === 'string' && body.aiModel.includes('|') && body.aiModel.length <= 200
        ? body.aiModel
        : undefined;
    const personal = body.aiModel === 'personal';

    const env = context.env;
    const session = await findRequestSession(env, context.request);
    if (aiModel && !session && ((await readSetting<boolean>(env, SETTINGS_KEYS.paidAiRegisteredOnly)) ?? true)) {
      throw new ApiError('UNAUTHORIZED', 401);
    }

    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));

    const cacheKey = await buildCacheKey({
      kind: 'ask',
      text: `${aiModel ?? (personal ? 'personal' : 'free')}|${question}`,
      sourceLang: 'auto',
      uiLang: answerLang,
    });
    const cached = await readCache<AskCore & { provider: string; model?: string }>(env, cacheKey);
    if (cached) {
      void bump(env, ['ask', 'ai_requests', 'total', 'cache_hits']);
      return jsonResponse({ ...cached, cached: true });
    }

    const limitGuard = createLimitGuard(env, getClientIp(context.request), session?.userId);
    const prompt = buildAskPrompt({ question, uiLang: answerLang });
    const { data, provider, model } = await runJsonTask<AskCore>({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateAsk,
      isRegistered: Boolean(session),
      ...(personal ? { only: ['paid', 'gemini', 'groq'], personalOnly: true } : {}),
      ...(aiModel ? { only: ['paid'], sharedPaidPick: aiModel } : {}),
    });

    const result: AskResponse = { ...data, provider, ...(model ? { model } : {}), cached: false };
    await writeCache(env, cacheKey, 'ask', result, ASK.cacheTtlSeconds);
    void bump(env, ['ask', 'ai_requests', 'total']);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
