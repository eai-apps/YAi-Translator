/** Требует вход: возвращает активную сессию или ошибку UNAUTHORIZED / SESSION_EXPIRED. */
import type { Env } from '../env';
import { ApiError } from '../http';
import { findSession, readSessionToken } from './session';
import type { ActiveSession } from './session';

export async function requireSession(env: Env, request: Request): Promise<ActiveSession> {
  const token = readSessionToken(request);
  if (!token) throw new ApiError('UNAUTHORIZED', 401);
  const session = await findSession(env, token);
  if (!session) throw new ApiError('SESSION_EXPIRED', 401);
  return session;
}
