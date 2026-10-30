/**
 * Проверка всех настроенных сервисов сайта (GET /api/health?check=1).
 * Все запросы идут параллельно, с таймаутом 8 с. Результат кэшируется в D1
 * на 10 минут, чтобы кнопкой нельзя было тратить лимиты сервисов.
 */
import type { ProviderId, ServiceCheck, UiLanguage } from '../../../shared/types';
import type { Env } from '../env';
import { APP_VERSION, HEALTH_CHECK } from '../config';
import { allKeys } from '../keypool';
import { isKeyUsable, loadKeyStates } from '../keystate';
import { ensureSchema } from '../schema';
import { describeError } from '../utils';
import { checkGemini, checkGroq, checkWorkersAi } from './ai';
import {
  checkDeepL,
  checkGoogle,
  checkLara,
  checkM2M100,
  checkMicrosoft,
  checkMyMemory,
} from './translators';

export type ServiceChecks = Partial<Record<ProviderId, ServiceCheck>>;

const CACHE_KIND = 'health';

/** Первый рабочий ключ сервиса (отдыхающие и неверные пропускаются). */
async function firstUsableKey(env: Env, provider: 'gemini' | 'groq'): Promise<string | null> {
  const [keys, states] = await Promise.all([allKeys(env, provider), loadKeyStates(env, provider)]);
  return keys.find((key) => isKeyUsable(states[key.id]))?.key ?? null;
}

/** Ключ кэша: результат зависит от языка интерфейса (тексты причин). */
function cacheKey(uiLang: UiLanguage): string {
  // Версия в ключе: после обновления проверок старый кэш не используется.
  return `${CACHE_KIND}:${APP_VERSION}:2:${uiLang}`;
}

async function readCached(env: Env, uiLang: UiLanguage): Promise<ServiceChecks | null> {
  if (!env.DB) return null;
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT payload FROM cache WHERE key = ? AND expires_at > ?')
      .bind(cacheKey(uiLang), Date.now())
      .first<{ payload: string }>();
    return row ? (JSON.parse(row.payload) as ServiceChecks) : null;
  } catch (error) {
    console.warn('Кэш проверки сервисов недоступен:', describeError(error));
    return null;
  }
}

async function writeCached(env: Env, uiLang: UiLanguage, checks: ServiceChecks): Promise<void> {
  if (!env.DB) return;
  const payload = JSON.stringify(checks);
  if (payload.length > HEALTH_CHECK.maxCachedPayloadBytes) return;
  const now = Date.now();
  try {
    await ensureSchema(env);
    await env.DB.prepare(
      'INSERT OR REPLACE INTO cache (key, kind, payload, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(
        cacheKey(uiLang),
        CACHE_KIND,
        payload,
        now,
        now + HEALTH_CHECK.cacheTtlSeconds * 1000,
      )
      .run();
  } catch (error) {
    console.warn('Кэш проверки сервисов не записан:', describeError(error));
  }
}

/** Настоящие запросы ко всем сервисам; ответ берётся из кэша D1, если он свежий. */
export async function runServiceChecks(
  env: Env,
  uiLang: UiLanguage,
): Promise<{ checks: ServiceChecks; cached: boolean }> {
  const cached = await readCached(env, uiLang);
  if (cached) return { checks: cached, cached: true };

  // Все проверки стартуют одновременно: каждая сама укладывается в 8 секунд.
  // Gemini и Groq проверяются первым рабочим ключом из пула (может быть и из админки).
  const [
    gemini,
    groq,
    workersai,
    deepl,
    lara,
    microsoft,
    google,
    mymemory,
    m2m100,
  ] = await Promise.all([
    checkGemini(env, uiLang, await firstUsableKey(env, 'gemini')),
    checkGroq(env, uiLang, await firstUsableKey(env, 'groq')),
    checkWorkersAi(env, uiLang),
    checkDeepL(env, uiLang),
    checkLara(env, uiLang),
    checkMicrosoft(env, uiLang),
    checkGoogle(env, uiLang),
    checkMyMemory(env, uiLang),
    checkM2M100(env, uiLang),
  ]);

  const checks: ServiceChecks = {
    gemini,
    groq,
    workersai,
    deepl,
    lara,
    microsoft,
    google,
    mymemory,
    m2m100,
  };
  await writeCached(env, uiLang, checks);
  return { checks, cached: false };
}
