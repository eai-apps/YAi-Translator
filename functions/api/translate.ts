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
import { ApiError, errorResponse, getClientIp, getUiLanguage, getUserKeys, jsonResponse, readJsonBody } from '../_lib/http';
import { createLimitGuard } from '../_lib/usage';
import { buildTranslatePrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import type { UserKeys } from '../_lib/router';
import { translateClassic } from '../_lib/classic';
import { validateTranslate } from '../_lib/validate';

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

/** ИИ с альтернативами. Ошибку LIMIT_REACHED пробрасываем — фронтенд покажет окно ключа. */
async function runAi(job: Job): Promise<TranslateResponse> {
  const { data, provider } = await runJsonTask({
    env: job.env,
    prompt: buildTranslatePrompt(job),
    userKeys: job.userKeys,
    signal: job.signal,
    beforeShared: job.limitGuard,
    validate: validateTranslate,
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

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      throw new ApiError('VALIDATION', 400);
    }

    const env = context.env;
    const job: Job = {
      env,
      text,
      sourceLang,
      targetLang,
      uiLang,
      userKeys: getUserKeys(context.request),
      signal: context.request.signal,
      limitGuard: createLimitGuard(env, getClientIp(context.request)),
    };

    // Кэш отдельно для каждого режима и выбранного переводчика.
    const cacheKey = await buildCacheKey({
      kind: 'translate',
      text: `${mode}|${chosen ?? 'any'}|${text}`,
      sourceLang,
      targetLang,
      uiLang,
    });
    const cached = await readCache<TranslateResponse>(env, cacheKey);
    if (cached) return jsonResponse({ ...cached, cached: true });

    let result: TranslateResponse | null;
    if (mode === 'ai') {
      result = await runAi(job);
    } else {
      result = await runClassic(job, chosen);
      // Выбранный переводчик не ответил — пробуем остальные, затем ИИ как последний шанс.
      if (!result && chosen) result = await runClassic(job, null);
      if (!result) result = await runAi(job);
    }

    await writeCache(env, cacheKey, 'translate', result);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
