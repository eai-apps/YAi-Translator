/**
 * GET /api/health        — состояние сервиса и список настроенных провайдеров.
 * GET /api/health?check=1 — плюс настоящие маленькие запросы ко всем настроенным сервисам
 *                           (результат кэшируется в D1 на 10 минут).
 *
 * Каждый вызов отмечает уникального посетителя за день: хеш «IP + день» в таблице visitors,
 * сам IP не сохраняется. Отсюда админка берёт число посетителей сайта.
 */
import type { HealthResponse, ProviderId } from '../../shared/types';
import { isKeysStorageEnabled } from '../_lib/auth/crypto';
import { runServiceChecks } from '../_lib/checks';
import { configuredClassic } from '../_lib/classic';
import { APP_VERSION, LIMITS } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getClientIp, getUiLanguage, jsonResponse } from '../_lib/http';
import { hasAnyKey } from '../_lib/keypool';
import { readDailyLimit } from '../_lib/settings';
import { registerVisitor } from '../_lib/stats';
import { sha256Hex } from '../_lib/utils';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;

    // Отметка посетителя: не чаще одного раза в день на один IP (хранится только хеш).
    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = await sha256Hex(`yai:visitor:${day}:${getClientIp(context.request)}`);
    await registerVisitor(env, visitorHash);

    // Обычные переводчики ищутся в пуле ключей: переменные Cloudflare и ключи из админки.
    const [classic, geminiKeys, groqKeys] = await Promise.all([
      configuredClassic(env),
      hasAnyKey(env, 'gemini'),
      hasAnyKey(env, 'groq'),
    ]);
    const providers: Record<ProviderId, boolean> = {
      gemini: geminiKeys,
      groq: groqKeys,
      deepl: Boolean(classic.deepl),
      lara: Boolean(classic.lara),
      workersai: Boolean(env.AI),
      mymemory: true,
      m2m100: Boolean(env.AI),
      microsoft: Boolean(classic.microsoft),
      google: Boolean(classic.google),
    };

    const body: HealthResponse = {
      ok: true,
      version: APP_VERSION,
      time: new Date().toISOString(),
      providers,
      limits: {
        maxTextLength: LIMITS.maxTextLength,
        freeRequestsPerDay: await readDailyLimit(env),
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
