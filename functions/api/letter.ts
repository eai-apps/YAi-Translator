/**
 * POST /api/letter — «Объясни письмо из Behörde» (Часть 17).
 * Разбор официальных писем на немецком языке простыми словами:
 * кто пишет, что хотят, срок (дедлайн), пошаговые действия и шаблон ответа.
 * Внимание: текст письма не сохраняется в кэш и на сервер дольше выполнения запроса.
 */
import type { LetterExplainCore, LetterExplainResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { ApiError, errorResponse, getClientIp, getHeaderKeys, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { findRequestSession, resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { runJsonTask } from '../_lib/router';
import { bump } from '../_lib/stats';
import { validateLetter } from '../_lib/validate';
import type { ProviderPrompt } from '../_lib/providers/types';
import { readSetting, SETTINGS_KEYS } from '../_lib/settings';

const MIN_LETTER_LENGTH = 10;
const MAX_LETTER_LENGTH = 6000;

function buildLetterPrompt(text: string, uiLang: string): ProviderPrompt {
  const system = [
    'You are an expert assistant helping residents in Germany understand official letters from authorities (Behörden, Jobcenter, Finanzamt, Krankenkasse, Vermieter, etc.).',
    `Explain the content clearly, calmly, and simply in the user's language (${uiLang}).`,
    'Respond ONLY with a valid JSON object matching this schema:',
    '{',
    '  "sender": "string (name of the authority or sender, e.g. Jobcenter Berlin)",',
    '  "summary": "string (2-3 concise sentences explaining what they want and what the letter is about)",',
    '  "deadline": "string | null (the exact date or deadline to react, e.g. 15.11.2026, or null if no deadline)",',
    '  "hasDeadline": true | false,',
    '  "urgency": "high" | "normal" | "low",',
    '  "steps": ["string", "string"] (2-4 clear concrete action steps the user must take),',
    '  "replyTemplate": "string (a formal, polite reply in German with placeholders like [Mein Name], [Aktenzeichen/Kundennummer], ready to send)"',
    '}',
  ].join('\n');

  return {
    task: 'explain',
    system,
    user: `Here is the letter text to analyze:\n\n"""\n${text.slice(0, MAX_LETTER_LENGTH)}\n"""`,
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const rawText = typeof body.text === 'string' ? body.text.trim() : '';

    if (rawText.length < MIN_LETTER_LENGTH) {
      throw new ApiError('VALIDATION', 400);
    }

    const explainUiLang = typeof body.uiLang === 'string' && body.uiLang ? body.uiLang : uiLang;

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
    const limitGuard = createLimitGuard(env, getClientIp(context.request), session?.userId);

    const prompt = buildLetterPrompt(rawText, explainUiLang);

    const { data, provider, model } = await runJsonTask<LetterExplainCore>({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateLetter,
      isRegistered: Boolean(session),
      ...(personal ? { only: ['paid', 'gemini', 'groq'], personalOnly: true } : {}),
      ...(aiModel ? { only: ['paid'], sharedPaidPick: aiModel } : {}),
    });

    // Важно: текст письма не сохраняется в базу данных/кэш ради конфиденциальности.
    void bump(env, ['letter', 'ai_requests', 'total']);

    const result: LetterExplainResponse = {
      ...data,
      provider,
      ...(model ? { model } : {}),
    };

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
