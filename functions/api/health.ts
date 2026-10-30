/** GET /api/health — состояние сервиса и список настроенных провайдеров. */
import type { HealthResponse } from '../../shared/types';
import { APP_VERSION, LIMITS } from '../_lib/config';
import type { Env } from '../_lib/env';
import { jsonResponse } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const body: HealthResponse = {
    ok: true,
    version: APP_VERSION,
    time: new Date().toISOString(),
    providers: {
      gemini: Boolean(env.GEMINI_API_KEY),
      groq: Boolean(env.GROQ_API_KEY),
      deepl: Boolean(env.DEEPL_API_KEY),
      workersai: Boolean(env.AI),
      mymemory: true,
      m2m100: Boolean(env.AI),
      microsoft: Boolean(env.MICROSOFT_TRANSLATOR_KEY),
      google: Boolean(env.GOOGLE_TRANSLATE_KEY),
    },
    limits: {
      maxTextLength: LIMITS.maxTextLength,
      freeRequestsPerDay: LIMITS.freeRequestsPerDay,
      cacheTtlHours: Math.round(LIMITS.cacheTtlSeconds / 3600),
    },
  };
  return jsonResponse(body);
};
