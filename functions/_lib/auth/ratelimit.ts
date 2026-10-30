/**
 * Защита от подбора пароля: не больше 10 попыток входа или регистрации
 * с одного IP за 15 минут. В D1 хранится только хеш IP (как в usage.ts).
 */
import { AUTH } from '../config';
import type { Env } from '../env';
import { ApiError } from '../http';
import { ensureSchema } from '../schema';
import { describeError, sha256Hex } from '../utils';

/** Начало текущего 15-минутного окна. */
function currentWindowStart(now: number): number {
  return now - (now % AUTH.attemptWindowMs);
}

/**
 * Считает попытку и отклоняет её, если лимит уже исчерпан.
 * Вызывать до проверки пароля, чтобы подбор нельзя было ускорить.
 */
export async function registerAttempt(env: Env, clientIp: string): Promise<void> {
  if (!env.DB) return; // локальная разработка без D1 — не блокируем

  const ipHash = await sha256Hex(`yai:login:${clientIp}`);
  const windowStart = currentWindowStart(Date.now());

  try {
    await ensureSchema(env);
    const row = await env.DB.prepare(
      'SELECT attempts FROM login_attempts WHERE ip_hash = ? AND window_start = ?',
    )
      .bind(ipHash, windowStart)
      .first<{ attempts: number }>();

    if (row && row.attempts >= AUTH.maxAttemptsPerWindow) {
      const retry = Math.max(1, Math.ceil((windowStart + AUTH.attemptWindowMs - Date.now()) / 1000));
      throw new ApiError('TOO_MANY_ATTEMPTS', 429, retry);
    }

    await env.DB.prepare(
      `INSERT INTO login_attempts (ip_hash, window_start, attempts) VALUES (?, ?, 1)
       ON CONFLICT(ip_hash, window_start) DO UPDATE SET attempts = attempts + 1`,
    )
      .bind(ipHash, windowStart)
      .run();

    // Иногда удаляем старые окна, чтобы таблица не росла бесконечно.
    if (Math.random() < 0.05) {
      await env.DB.prepare('DELETE FROM login_attempts WHERE window_start < ?')
        .bind(windowStart - AUTH.attemptWindowMs * 4)
        .run();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Если D1 недоступна, вход не ломаем — просто не считаем попытки.
    console.warn('Счётчик попыток входа недоступен:', describeError(error));
  }
}
