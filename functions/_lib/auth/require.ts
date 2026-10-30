/**
 * Требует вход: возвращает активную сессию или ошибку UNAUTHORIZED / SESSION_EXPIRED.
 * Заблокированный админом аккаунт получает ACCOUNT_BLOCKED, его сессии удаляются.
 */
import type { Env } from '../env';
import { ApiError } from '../http';
import { findSession, readSessionToken, deleteUserSessions } from './session';
import type { ActiveSession } from './session';
import { findUserById } from './users';

export async function requireSession(env: Env, request: Request): Promise<ActiveSession> {
  const token = readSessionToken(request);
  if (!token) throw new ApiError('UNAUTHORIZED', 401);
  const session = await findSession(env, token);
  if (!session) throw new ApiError('SESSION_EXPIRED', 401);

  const user = await findUserById(env, session.userId);
  if (!user) {
    await deleteUserSessions(env, session.userId);
    throw new ApiError('SESSION_EXPIRED', 401);
  }
  if (user.blocked) {
    await deleteUserSessions(env, session.userId);
    throw new ApiError('ACCOUNT_BLOCKED', 403);
  }
  return session;
}
