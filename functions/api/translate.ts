/**
 * POST /api/translate — перевод фразы или текста.
 * Порядок: кэш → ИИ (ключ пользователя, Gemini, Groq) с альтернативами →
 * обычные переводчики (DeepL, Microsoft, Google, MyMemory) → Workers AI → M2M100.
 * Обычные переводчики не тратят дневной лимит ИИ.
 */
import type { TranslateResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { ApiError, errorResponse, getClientIp, getUiLanguage, getUserKeys, jsonResponse, readJsonBody } from '../_lib/http';
import { createLimitGuard } from '../_lib/usage';
import { buildTranslatePrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { translateClassic } from '../_lib/classic';
import { validateTranslate } from '../_lib/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);
    const classicOnly = body.mode === 'classic';

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      throw new ApiError('VALIDATION', 400);
    }

    const env = context.env;
    const signal = context.request.signal;
    const userKeys = getUserKeys(context.request);

    // 1. Кэш: одинаковый запрос не тратит лимиты. Обычный режим кэшируется отдельно.
    const cacheKey = await buildCacheKey({
      kind: 'translate',
      text: classicOnly ? `classic|${text}` : text,
      sourceLang,
      targetLang,
      uiLang,
    });
    const cached = await readCache<TranslateResponse>(env, cacheKey);
    if (cached) return jsonResponse({ ...cached, cached: true });

    // Дневной лимит считается, только когда дело доходит до общих ключей ИИ.
    const limitGuard = createLimitGuard(env, getClientIp(context.request));
    const prompt = buildTranslatePrompt({ text, sourceLang, targetLang, uiLang });
    let result: TranslateResponse | null = null;

    // 2. ИИ с альтернативами: ключ пользователя, затем общие Gemini и Groq.
    if (!classicOnly) {
      try {
        const { data, provider } = await runJsonTask({
          env,
          prompt,
          userKeys,
          signal,
          beforeShared: limitGuard,
          validate: validateTranslate,
          only: ['gemini', 'groq'],
        });
        result = { ...data, provider, cached: false };
      } catch {
        // Лимит ИИ или сбой — ниже работают обычные переводчики.
      }
    }

    // 3. Обычные переводчики без ИИ — только основной перевод, без альтернатив.
    if (!result) {
      const classic = await translateClassic(
        { env, text, sourceLang, targetLang, signal },
        ['deepl', 'microsoft', 'google', 'mymemory'],
      );
      if (classic) {
        result = {
          translatedText: classic.text,
          alternatives: [],
          detectedLang: classic.detectedLang,
          provider: classic.provider,
          cached: false,
        };
      }
    }

    // 4. Workers AI (чат-модель с альтернативами), если лимит ИИ ещё не исчерпан.
    if (!result && !classicOnly) {
      try {
        const { data, provider } = await runJsonTask({
          env,
          prompt,
          userKeys: {},
          signal,
          beforeShared: limitGuard,
          validate: validateTranslate,
          only: ['workersai'],
        });
        result = { ...data, provider, cached: false };
      } catch {
        // Ниже — последний вариант.
      }
    }

    // 5. M2M100 — открытая модель перевода внутри Cloudflare, последний запасной вариант.
    if (!result) {
      const classic = await translateClassic({ env, text, sourceLang, targetLang, signal }, ['m2m100']);
      if (classic) {
        result = {
          translatedText: classic.text,
          alternatives: [],
          detectedLang: classic.detectedLang,
          provider: classic.provider,
          cached: false,
        };
      }
    }

    if (!result) throw new ApiError('LIMIT_REACHED', 429);

    await writeCache(env, cacheKey, 'translate', result);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
