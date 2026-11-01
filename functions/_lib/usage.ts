/**
 * Дневной лимит бесплатных запросов с одного IP. В D1 хранится только хеш IP.
 * Значение лимита задаётся в админке (таблица settings), иначе LIMITS.freeRequestsPerDay.
 */
import type { Env } from './env';
import { ApiError } from './http';
import { describeError, sha256Hex } from './utils';
import { ensureSchema } from './schema';
import { readSetting, SETTINGS_KEYS } from './settings';

/**
 * Проверяет лимит. По умолчанию сразу увеличивает счётчик на единицу;
 * с increment = false — только проверка (счётчик увеличит commitDailyUsage после удачного ответа).
 */
export async function enforceDailyLimit(env: Env, clientIp: string, userId?: string, increment = true): Promise<void> {
  if (!env.DB) return; // локальная разработка без D1 — не блокируем

  const isRegistered = Boolean(userId);
  if (!isRegistered) {
    const aiRequiresLogin = await readSetting<boolean>(env, SETTINGS_KEYS.aiRequiresLogin);
    if (aiRequiresLogin) {
      throw new ApiError('UNAUTHORIZED', 401);
    }
  }

  const limit = isRegistered
    ? (await readSetting<number>(env, SETTINGS_KEYS.registeredAiLimit)) ?? 50
    : (await readSetting<number>(env, SETTINGS_KEYS.guestAiLimit)) ?? 5;

  const keySeed = isRegistered ? `user:${userId}` : `ip:${clientIp}`;
  const ipHash = await sha256Hex(`yai:${keySeed}`);
  const day = new Date().toISOString().slice(0, 10);

  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT requests FROM usage WHERE ip_hash = ? AND day = ?')
      .bind(ipHash, day)
      .first<{ requests: number }>();

    if (row && row.requests >= limit) {
      throw new ApiError('LIMIT_REACHED', 429);
    }
    if (!increment) return;

    await env.DB.prepare(
      `INSERT INTO usage (ip_hash, day, requests, updated_at) VALUES (?, ?, 1, ?)
       ON CONFLICT(ip_hash, day) DO UPDATE SET requests = requests + 1, updated_at = excluded.updated_at`,
    )
      .bind(ipHash, day, Date.now())
      .run();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Если D1 временно недоступна, лучше перевести текст, чем показать ошибку.
    console.warn('Счётчик запросов недоступен:', describeError(error));
  }
}

/** Увеличивает дневной счётчик на единицу (после удачного ответа нейросети). */
export async function commitDailyUsage(env: Env, clientIp: string, userId?: string): Promise<void> {
  if (!env.DB) return;
  const keySeed = userId ? `user:${userId}` : `ip:${clientIp}`;
  const ipHash = await sha256Hex(`yai:${keySeed}`);
  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(
      `INSERT INTO usage (ip_hash, day, requests, updated_at) VALUES (?, ?, 1, ?)
       ON CONFLICT(ip_hash, day) DO UPDATE SET requests = requests + 1, updated_at = excluded.updated_at`,
    )
      .bind(ipHash, day, Date.now())
      .run();
  } catch (error) {
    console.warn('Счётчик запросов недоступен:', describeError(error));
  }
}

/** «Шлагбаум» общих ключей: вызов — проверка лимита, commit() — списать одну попытку (только за удачный ответ). */
export interface LimitGuard {
  (): Promise<void>;
  commit?: () => Promise<void>;
}

/**
 * Возвращает функцию-«шлагбаум»: при обращении к общим ключам сайта проверяет дневной лимит.
 * Попытка списывается только за удачный ответ нейросети (commit) — ошибки сервисов и прерванные
 * запросы лимит не тратят (раньше из-за этого вошедшие быстро видели «попытки закончились»).
 */
export function createLimitGuard(env: Env, clientIp: string, userId?: string): LimitGuard {
  let pending: Promise<void> | null = null;
  let committed = false;
  const guard: LimitGuard = () => {
    pending ??= enforceDailyLimit(env, clientIp, userId, false);
    return pending;
  };
  guard.commit = async () => {
    if (committed) return;
    committed = true;
    await commitDailyUsage(env, clientIp, userId);
  };
  return guard;
}
