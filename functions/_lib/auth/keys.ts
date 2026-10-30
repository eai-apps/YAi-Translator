/**
 * Ключи ИИ пользователя в аккаунте.
 * Главная точка входа для эндпоинтов перевода — resolveUserKeys:
 * ключи из заголовков X-User-* важнее, затем расшифровываются ключи из аккаунта.
 */
import type { KeyProvider, StoredKeyInfo } from '../../../shared/types';
import type { Env } from '../env';
import { ensureSchema } from '../schema';
import { describeError } from '../utils';
import { decryptKey, encryptKey, keyLast4 } from './crypto';
import { findSession, readSessionToken } from './session';

export interface UserKeys {
  gemini?: string;
  groq?: string;
}

interface UserKeyRow {
  provider: string;
  ciphertext: string;
  iv: string;
  last4: string;
  updated_at: number;
}

/** Находит сессию по токену запроса. null — запрос без входа. */
export async function findRequestSession(env: Env, request: Request) {
  return findSession(env, readSessionToken(request));
}

/**
 * Ключи для запроса: сначала заголовки, затем ключи из аккаунта (если есть сессия).
 * Расшифровка идёт только при наличии сессии, поэтому обычные запросы не платят за неё.
 */
export async function resolveUserKeys(
  env: Env,
  request: Request,
  headerKeys: UserKeys,
): Promise<UserKeys> {
  if (headerKeys.gemini && headerKeys.groq) return headerKeys;

  const session = await findRequestSession(env, request);
  if (!session) return headerKeys;

  const stored = await readUserKeys(env, session.userId);
  return {
    gemini: headerKeys.gemini ?? stored.gemini,
    groq: headerKeys.groq ?? stored.groq,
  };
}

/** Расшифрованные ключи пользователя (никогда не отдаются клиенту в открытом виде). */
export async function readUserKeys(env: Env, userId: string): Promise<UserKeys> {
  if (!env.DB) return {};
  try {
    await ensureSchema(env);
    const result = await env.DB.prepare('SELECT * FROM user_keys WHERE user_id = ?')
      .bind(userId)
      .all<UserKeyRow>();
    const keys: UserKeys = {};
    for (const row of result.results ?? []) {
      if (row.provider !== 'gemini' && row.provider !== 'groq') continue;
      keys[row.provider] = await decryptKey(env, row.ciphertext, row.iv, `${userId}:${row.provider}`);
    }
    return keys;
  } catch (error) {
    console.warn('Ключи пользователя не расшифрованы:', describeError(error));
    return {};
  }
}

/** Сохранённые ключи без секрета: только последние 4 символа и дата. */
export async function readKeyInfos(
  env: Env,
  userId: string,
): Promise<Record<KeyProvider, StoredKeyInfo | null>> {
  const info: Record<KeyProvider, StoredKeyInfo | null> = { gemini: null, groq: null };
  if (!env.DB) return info;
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM user_keys WHERE user_id = ?')
    .bind(userId)
    .all<UserKeyRow>();
  for (const row of result.results ?? []) {
    if (row.provider !== 'gemini' && row.provider !== 'groq') continue;
    info[row.provider] = { last4: row.last4, updatedAt: row.updated_at };
  }
  return info;
}

export async function saveUserKey(
  env: Env,
  userId: string,
  provider: KeyProvider,
  key: string,
): Promise<StoredKeyInfo> {
  if (!env.DB) throw new Error('D1 недоступна');
  await ensureSchema(env);
  const { ciphertext, iv } = await encryptKey(env, key, `${userId}:${provider}`);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO user_keys (user_id, provider, ciphertext, iv, last4, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, provider) DO UPDATE SET
       ciphertext = excluded.ciphertext, iv = excluded.iv,
       last4 = excluded.last4, updated_at = excluded.updated_at`,
  )
    .bind(userId, provider, ciphertext, iv, keyLast4(key), now)
    .run();
  return { last4: keyLast4(key), updatedAt: now };
}

export async function deleteUserKey(env: Env, userId: string, provider: KeyProvider): Promise<void> {
  if (!env.DB) return;
  await ensureSchema(env);
  await env.DB.prepare('DELETE FROM user_keys WHERE user_id = ? AND provider = ?')
    .bind(userId, provider)
    .run();
}
