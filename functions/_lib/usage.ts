/**
 * Дневной лимит бесплатных запросов с одного IP. В D1 хранится только хеш IP.
 * Значение лимита задаётся в админке (таблица settings), иначе LIMITS.freeRequestsPerDay.
 */
import type { Env } from './env';
import { ApiError } from './http';
import { describeError, sha256Hex } from './utils';
import { ensureSchema } from './schema';
import { readSetting, SETTINGS_KEYS } from './settings';

/** Проверяет лимит и сразу увеличивает счётчик на единицу. */
export async function enforceDailyLimit(env: Env, clientIp: string, userId?: string): Promise<void> {
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

/**
 * Возвращает функцию-«шлагбаум»: при первом обращении к общим ключам сайта
 * проверяет и увеличивает дневной счётчик, повторные вызовы ничего не добавляют.
 */
export function createLimitGuard(env: Env, clientIp: string, userId?: string): () => Promise<void> {
  let pending: Promise<void> | null = null;
  return () => {
    pending ??= enforceDailyLimit(env, clientIp, userId);
    return pending;
  };
}
