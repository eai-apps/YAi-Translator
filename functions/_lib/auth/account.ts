/** Собирает данные профиля для GET /api/auth/me и ответов входа. */
import type { AccountInfo } from '../../../shared/types';
import type { Env } from '../env';
import { ApiError } from '../http';
import { isKeysStorageEnabled } from './crypto';
import { readKeyInfos } from './keys';
import { isAdminLogin } from '../admin/access';
import { listSessions } from './session';
import { findUserById } from './users';

export async function buildAccountInfo(
  env: Env,
  userId: string,
  currentTokenHash: string,
): Promise<AccountInfo> {
  const user = await findUserById(env, userId);
  if (!user) throw new ApiError('SESSION_EXPIRED', 401);

  const [sessions, keys] = await Promise.all([
    listSessions(env, userId),
    readKeyInfos(env, userId),
  ]);

  return {
    login: user.login,
    createdAt: user.created_at,
    sessions: sessions.map((row) => ({
      device: row.device || '',
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      current: row.token_hash === currentTokenHash,
    })),
    keys,
    keysStorageEnabled: isKeysStorageEnabled(env),
    isAdmin: isAdminLogin(env, user.login),
  };
}
