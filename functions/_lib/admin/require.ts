/** Каждый запрос админки проверяет сессию и права; иначе 401 / 403. */
import type { Env } from '../env';
import { ApiError } from '../http';
import { requireSession } from '../auth/require';
import type { ActiveSession } from '../auth/session';
import { findUserById } from '../auth/users';
import { isAdminLogin } from './access';

export interface AdminSession extends ActiveSession {
  login: string;
}

export async function requireAdmin(env: Env, request: Request): Promise<AdminSession> {
  const session = await requireSession(env, request);
  const user = await findUserById(env, session.userId);
  if (!user) throw new ApiError('SESSION_EXPIRED', 401);
  if (!isAdminLogin(env, user.login)) throw new ApiError('FORBIDDEN', 403);
  return { ...session, login: user.login };
}

/** Запись действия в журнал админов (таблица admin_log). */
export async function logAdminAction(
  env: Env,
  admin: AdminSession,
  action: string,
  details: string | null = null,
): Promise<void> {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      'INSERT INTO admin_log (id, at, user_id, login, action, details) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(crypto.randomUUID(), Date.now(), admin.userId, admin.login, action, details)
      .run();
  } catch (error) {
    console.warn('Действие админа не записано в журнал:', error instanceof Error ? error.message : error);
  }
}
