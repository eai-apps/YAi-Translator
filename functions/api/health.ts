/**
 * GET /api/health        — состояние сервиса и список настроенных провайдеров.
 * GET /api/health?check=1 — плюс настоящие маленькие запросы ко всем настроенным сервисам
 *                           (результат кэшируется в D1 на 10 минут).
 */
import type { HealthResponse, ProviderId } from '../../shared/types';
import { isKeysStorageEnabled } from '../_lib/auth/crypto';
import { runServiceChecks } from '../_lib/checks';
import { APP_VERSION, LIMITS } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const providers: Record<ProviderId, boolean> = {
      gemini: Boolean(env.GEMINI_API_KEY),
      groq: Boolean(env.GROQ_API_KEY),
      deepl: Boolean(env.DEEPL_API_KEY),
      workersai: Boolean(env.AI),
      mymemory: true,
      m2m100: Boolean(env.AI),
      microsoft: Boolean(env.MICROSOFT_TRANSLATOR_KEY),
      google: Boolean(env.GOOGLE_TRANSLATE_KEY),
    };

    const body: HealthResponse = {
      ok: true,
      version: APP_VERSION,
      time: new Date().toISOString(),
      providers,
      limits: {
        maxTextLength: LIMITS.maxTextLength,
        freeRequestsPerDay: LIMITS.freeRequestsPerDay,
        cacheTtlHours: Math.round(LIMITS.cacheTtlSeconds / 3600),
      },
      keysStorageEnabled: isKeysStorageEnabled(env),
    };

    const wantsCheck = new URL(context.request.url).searchParams.get('check') === '1';
    if (wantsCheck) {
      const result = await runServiceChecks(env, uiLang);
      body.checks = result.checks;
      body.checksCached = result.cached;
    }

    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
