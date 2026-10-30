/** Общие проверки для /api/keys/:provider: провайдер из адреса и вход в аккаунт. */
import type { KeyProvider } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { isKeysStorageEnabled } from '../../_lib/auth/crypto';
import { requireSession } from '../../_lib/auth/require';
import type { ActiveSession } from '../../_lib/auth/session';
import { ApiError } from '../../_lib/http';

/** «gemini» или «groq» в адресе; всё остальное — 404. */
export function readProvider(raw: unknown): KeyProvider {
  const provider = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (provider !== 'gemini' && provider !== 'groq') throw new ApiError('NOT_FOUND', 404);
  return provider;
}

/** Требуется вход и включённое хранение ключей на сервере. */
export async function requireKeysAccess(
  env: Env,
  request: Request,
  rawProvider: unknown,
): Promise<{ session: ActiveSession; provider: KeyProvider }> {
  const provider = readProvider(rawProvider);
  if (!isKeysStorageEnabled(env)) throw new ApiError('KEYS_STORAGE_DISABLED', 503);
  const session = await requireSession(env, request);
  return { session, provider };
}
