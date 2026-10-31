/**
 * POST /api/word-ask — чат «Спроси про слово» в словаре.
 * Использует buildWordAskPrompt с контекстом карточки; ответ НЕ кэшируется
 * (вопросы персональные и зависят от истории диалога).
 */
import type { AskResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import {
  ApiError,
  errorResponse,
  getClientIp,
  getHeaderKeys,
  getUiLanguage,
  jsonResponse,
  readJsonBody,
} from '../_lib/http';
import { requireUiLanguage } from '../_lib/request';
import { findRequestSession, resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { buildWordAskPrompt } from '../_lib/promptsWordAsk';
import { runJsonTask } from '../_lib/router';
import { bump } from '../_lib/stats';
import { validateAsk } from '../_lib/validate';
import { ASK, LIMITS } from '../_lib/config';

const MAX_WORD_LENGTH = LIMITS.maxWordLength;
const MAX_CONTEXT_LENGTH = 600;
const MAX_HISTORY = 12; // 6 пар

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

function normalizeHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is HistoryMessage =>
        item &&
        typeof item === 'object' &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string',
    )
    .slice(-MAX_HISTORY)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 500) }));
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);

    const word = typeof body.word === 'string' ? body.word.trim().slice(0, MAX_WORD_LENGTH) : '';
    if (!word) throw new ApiError('VALIDATION', 400);

    const question =
      typeof body.question === 'string'
        ? body.question.trim().slice(0, ASK.maxQuestionLength)
        : '';
    if (question.length < 3) throw new ApiError('VALIDATION', 400);

    const wordContext =
      typeof body.wordContext === 'string'
        ? body.wordContext.trim().slice(0, MAX_CONTEXT_LENGTH)
        : '';

    const history = normalizeHistory(body.history);
    const answerLang = requireUiLanguage(body.uiLang ?? uiLang);

    const env = context.env;
    const session = await findRequestSession(env, context.request);
    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));
    const limitGuard = createLimitGuard(env, getClientIp(context.request), session?.userId);

    const prompt = buildWordAskPrompt({ word, wordContext, question, history, uiLang: answerLang });

    const { data, provider } = await runJsonTask({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateAsk,
      isRegistered: Boolean(session),
    });

    const result: AskResponse = { ...data, provider, cached: false };
    void bump(env, ['ask', 'ai_requests', 'total']);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
