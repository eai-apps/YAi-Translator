/**
 * Состояние ключей сайта (таблица key_state): какой ключ отдыхает до 00:00 UTC,
 * какой признан неверным. Сам ключ здесь не хранится — только key_id
 * (первые 12 символов SHA-256).
 */
import type { SiteKeyProvider } from '../../shared/types';
import type { Env } from './env';
import { allKeys } from './keypool';
import type { PooledKey } from './keypool';
import { ensureSchema } from './schema';

export interface KeyState {
  exhaustedUntil: number | null;
  invalid: boolean;
  lastError: string | null;
  lastUsedAt: number | null;
}

interface KeyStateRow {
  key_id: string;
  exhausted_until: number | null;
  invalid: number | null;
  last_error: string | null;
  last_used_at: number | null;
}

/** Начало следующих суток по UTC — до этого времени отдыхает исчерпанный ключ. */
function nextUtcMidnight(now = Date.now()): number {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
}

/** Состояния всех ключей сервиса одним запросом. */
export async function loadKeyStates(
  env: Env,
  provider: SiteKeyProvider,
): Promise<Record<string, KeyState>> {
  const states: Record<string, KeyState> = {};
  if (!env.DB) return states;
  try {
    await ensureSchema(env);
    const result = await env.DB.prepare('SELECT * FROM key_state WHERE provider = ?')
      .bind(provider)
      .all<KeyStateRow>();
    for (const row of result.results ?? []) {
      states[row.key_id] = {
        exhaustedUntil: row.exhausted_until ?? null,
        invalid: Boolean(row.invalid),
        lastError: row.last_error ?? null,
        lastUsedAt: row.last_used_at ?? null,
      };
    }
  } catch {
    // Без журнала состояний все ключи считаются рабочими.
  }
  return states;
}

/** Ключ рабочий прямо сейчас: не неверный и не отдыхающий. */
export function isKeyUsable(state: KeyState | undefined, now = Date.now()): boolean {
  if (!state) return true;
  if (state.invalid) return false;
  return !(state.exhaustedUntil && state.exhaustedUntil > now);
}

async function writeState(
  env: Env,
  provider: SiteKeyProvider,
  id: string,
  patch: { exhaustedUntil?: number | null; invalid?: boolean; lastError?: string | null; used?: boolean },
): Promise<void> {
  if (!env.DB) return;
  try {
    await ensureSchema(env);
    await env.DB.prepare(
      `INSERT INTO key_state (provider, key_id, exhausted_until, invalid, last_error, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, key_id) DO UPDATE SET
         exhausted_until = excluded.exhausted_until,
         invalid = excluded.invalid,
         last_error = excluded.last_error,
         last_used_at = COALESCE(excluded.last_used_at, key_state.last_used_at)`,
    )
      .bind(
        provider,
        id,
        patch.exhaustedUntil ?? null,
        patch.invalid ? 1 : 0,
        patch.lastError ?? null,
        patch.used ? Date.now() : null,
      )
      .run();
  } catch (error) {
    console.warn('Состояние ключа не сохранено:', error instanceof Error ? error.message : error);
  }
}

/** Ключ ответил 429 или сообщил об исчерпанной квоте — отдыхает до 00:00 UTC. */
export async function markExhausted(
  env: Env,
  provider: SiteKeyProvider,
  id: string,
  message: string,
): Promise<void> {
  await writeState(env, provider, id, {
    exhaustedUntil: nextUtcMidnight(),
    lastError: message.slice(0, 200),
    used: true,
  });
}

/** Ключ ответил 401/403 — больше не используется. */
export async function markInvalid(
  env: Env,
  provider: SiteKeyProvider,
  id: string,
  message: string,
): Promise<void> {
  await writeState(env, provider, id, { invalid: true, lastError: message.slice(0, 200), used: true });
}

/** Ключ ответил — снимаем отдых и ошибку (например, после проверки в админке). */
export async function markHealthy(env: Env, provider: SiteKeyProvider, id: string): Promise<void> {
  await writeState(env, provider, id, { exhaustedUntil: null, invalid: false, lastError: null, used: true });
}

/** Отмечает время использования без изменения состояния. */
export async function markUsed(env: Env, provider: SiteKeyProvider, id: string): Promise<void> {
  await writeState(env, provider, id, { used: true });
}

/** Рабочие ключи сервиса по очереди: неверные и «отдыхающие» пропускаются. */
export async function usableKeys(env: Env, provider: SiteKeyProvider): Promise<PooledKey[]> {
  const keys = await allKeys(env, provider);
  if (keys.length === 0) return [];
  const states = await loadKeyStates(env, provider);
  const now = Date.now();
  return keys.filter((key) => isKeyUsable(states[key.id], now));
}
