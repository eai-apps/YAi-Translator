/** Кэш ответов ИИ в D1: один и тот же запрос не тратит лимит провайдеров. */
import type { TaskKind } from '../../shared/types';
import { LIMITS } from './config';
import type { Env } from './env';
import { describeError } from './utils';

interface CacheRow {
  payload: string;
}

/** Читает значение из кэша. Без базы (локально) просто возвращает null. */
export async function readCache<T>(env: Env, key: string): Promise<T | null> {
  if (!env.DB) return null;
  try {
    const row = await env.DB.prepare(
      'SELECT payload FROM cache WHERE key = ? AND expires_at > ? LIMIT 1',
    )
      .bind(key, Date.now())
      .first<CacheRow>();
    if (!row) return null;
    return JSON.parse(row.payload) as T;
  } catch (error) {
    console.warn('Кэш недоступен для чтения:', describeError(error));
    return null;
  }
}

/** Сохраняет ответ в кэш. Слишком большие ответы не кэшируем. */
export async function writeCache(env: Env, key: string, kind: TaskKind, value: unknown): Promise<void> {
  if (!env.DB) return;
  const payload = JSON.stringify(value);
  if (payload.length > LIMITS.maxCachedPayloadBytes) return;

  const now = Date.now();
  try {
    await env.DB.prepare(
      'INSERT OR REPLACE INTO cache (key, kind, payload, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(key, kind, payload, now, now + LIMITS.cacheTtlSeconds * 1000)
      .run();

    // Иногда подчищаем просроченные записи, чтобы база не росла бесконечно.
    if (Math.random() < 0.05) {
      await env.DB.prepare('DELETE FROM cache WHERE expires_at <= ?').bind(now).run();
    }
  } catch (error) {
    console.warn('Кэш недоступен для записи:', describeError(error));
  }
}
