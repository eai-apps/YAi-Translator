/** Дневной лимит бесплатных запросов с одного IP. В D1 хранится только хеш IP. */
import { LIMITS } from './config';
import type { Env } from './env';
import { ApiError } from './http';
import { describeError, sha256Hex } from './utils';

/** Проверяет лимит и сразу увеличивает счётчик на единицу. */
export async function enforceDailyLimit(env: Env, clientIp: string): Promise<void> {
  if (!env.DB) return; // локальная разработка без D1 — не блокируем

  const ipHash = await sha256Hex(`yai:${clientIp}`);
  const day = new Date().toISOString().slice(0, 10);

  try {
    const row = await env.DB.prepare('SELECT requests FROM usage WHERE ip_hash = ? AND day = ?')
      .bind(ipHash, day)
      .first<{ requests: number }>();

    if (row && row.requests >= LIMITS.freeRequestsPerDay) {
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
 * Так фальшивый «ключ пользователя» в заголовке не даёт обойти лимит.
 */
export function createLimitGuard(env: Env, clientIp: string): () => Promise<void> {
  let pending: Promise<void> | null = null;
  return () => {
    pending ??= enforceDailyLimit(env, clientIp);
    return pending;
  };
}
