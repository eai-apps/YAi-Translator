/**
 * POST /api/translate — перевод фразы или текста.
 *
 * mode = 'classic' (по умолчанию): кэш → обычные переводчики без ИИ
 *   (DeepL → Microsoft → Google → MyMemory → M2M100). ИИ — только если все они молчат.
 * mode = 'ai' (кнопка «Спросить у AI»): кэш → ключ пользователя → Gemini → Groq → Workers AI,
 *   с альтернативами в разных стилях. На общих ключах действует дневной лимит.
 */
import { CLASSIC_PROVIDERS } from '../../shared/types';
import type { ClassicProviderId, LanguageCode, SourceLanguage, TranslateResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { ApiError, errorResponse, getClientIp, getHeaderKeys, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { buildTranslatePrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import type { UserKeys } from '../_lib/router';
import { translateClassic } from '../_lib/classic';
import { bump } from '../_lib/stats';
import { validateTranslate } from '../_lib/validate';

/** Языковая пара для статистики: «auto» заменяется языком, определённым при переводе. */
async function recordTranslation(env: Env, response: TranslateResponse, sourceLang: SourceLanguage, targetLang: LanguageCode) {
  const from = sourceLang === 'auto' ? (response.detectedLang ?? 'auto') : sourceLang;
  // total — все переводы за день, cache_hits — сколько из них отдал кэш.
  const metrics = [
    'total',
    `translations:${response.provider}`,
    `pair:${from}-${targetLang}`,
  ];
  if (response.cached) metrics.push('cache_hits');
  if (isAi(response)) metrics.push('ai_requests');
  await bump(env, metrics);
}

function isAi(response: TranslateResponse): boolean {
  return response.provider === 'gemini' || response.provider === 'groq' || response.provider === 'workersai';
}

interface Job {
  env: Env;
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  uiLang: ReturnType<typeof getUiLanguage>;
  userKeys: UserKeys;
  signal: AbortSignal;
  limitGuard: () => Promise<void>;
}

/** Обычные переводчики: выбранный пользователем или все по очереди. */
async function runClassic(job: Job, only: ClassicProviderId | null): Promise<TranslateResponse | null> {
  const classic = await translateClassic(
    { env: job.env, text: job.text, sourceLang: job.sourceLang, targetLang: job.targetLang, signal: job.signal },
    only ? [only] : CLASSIC_PROVIDERS,
  );
  if (!classic) return null;
  return {
    translatedText: classic.text,
    alternatives: [],
    detectedLang: classic.detectedLang,
    provider: classic.provider,
    cached: false,
  };
}

/** ИИ, который можно выбрать в списке переводчиков: только с личным ключом пользователя. */
const PERSONAL_AI = ['gemini', 'groq'] as const;
type PersonalAi = (typeof PERSONAL_AI)[number];

/**
 * ИИ с альтернативами. Ошибку LIMIT_REACHED пробрасываем — фронтенд покажет окно ключа.
 * personal — человек выбрал в списке «Gemini» или «Groq»: работает только его личный ключ.
 */
async function runAi(job: Job, personal: PersonalAi | null = null): Promise<TranslateResponse> {
  if (personal && !job.userKeys[personal]) throw new ApiError('LIMIT_REACHED', 429);
  const { data, provider } = await runJsonTask({
    env: job.env,
    prompt: buildTranslatePrompt(job),
    userKeys: job.userKeys,
    signal: job.signal,
    beforeShared: job.limitGuard,
    validate: validateTranslate,
    ...(personal ? { only: [personal], personalOnly: true } : {}),
  });
  return { ...data, provider, cached: false };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);
    const mode = body.mode === 'ai' ? 'ai' : 'classic';
    const chosen = CLASSIC_PROVIDERS.find((id) => id === body.provider) ?? null;
    const personalAi = mode === 'ai' ? (PERSONAL_AI.find((id) => id === body.provider) ?? null) : null;

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      throw new ApiError('VALIDATION', 400);
    }

    const env = context.env;
    // Ключи: заголовки X-User-* важнее, затем расшифрованные ключи аккаунта.
    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));
    const job: Job = {
      env,
      text,
      sourceLang,
      targetLang,
      uiLang,
      userKeys,
      signal: context.request.signal,
      limitGuard: createLimitGuard(env, getClientIp(context.request)),
    };

    // Кэш отдельно для каждого режима и выбранного переводчика.
    const cacheKey = await buildCacheKey({
      kind: 'translate',
      text: `${mode}|${chosen ?? personalAi ?? 'any'}|${text}`,
      sourceLang,
      targetLang,
      uiLang,
    });
    const cached = await readCache<TranslateResponse>(env, cacheKey);
    if (cached) {
      void recordTranslation(env, cached, sourceLang, targetLang);
      return jsonResponse({ ...cached, cached: true });
    }

    let result: TranslateResponse | null;
    if (mode === 'ai') {
      result = await runAi(job, personalAi);
    } else {
      result = await runClassic(job, chosen);
      // Выбранный переводчик не ответил — пробуем остальные, затем ИИ как последний шанс.
      if (!result && chosen) result = await runClassic(job, null);
      if (!result) result = await runAi(job);
    }

    await writeCache(env, cacheKey, 'translate', result);
    void recordTranslation(env, result, sourceLang, targetLang);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
