/**
 * Пользователи в админке.
 * GET  /api/admin/users                — логин, регистрация, вход, устройства, ключи, блокировка.
 * POST /api/admin/users {login, action} — action: "block" | "unblock" | "delete".
 */
import type { AdminUserItem, AdminUsersResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { ADMIN } from '../../_lib/config';
import { logAdminAction, requireAdmin } from '../../_lib/admin/require';
import { deleteUserSessions } from '../../_lib/auth/session';
import { deleteUser, findUserByLogin, setUserBlocked } from '../../_lib/auth/users';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { ensureSchema } from '../../_lib/schema';

interface UserListRow {
  id: string;
  login: string;
  created_at: number;
  last_login_at: number | null;
  blocked: number | null;
  devices: number | null;
  keys: number | null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const env = context.env;
    const users: AdminUserItem[] = [];
    if (env.DB) {
      await ensureSchema(env);
      const result = await env.DB.prepare(
        `SELECT u.id, u.login, u.created_at, u.last_login_at, u.blocked,
                (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > ?) AS devices,
                (SELECT COUNT(*) FROM user_keys k WHERE k.user_id = u.id) AS keys
         FROM users u
         ORDER BY u.created_at DESC
         LIMIT ?`,
      )
        .bind(Date.now(), ADMIN.maxUsersListed)
        .all<UserListRow>();
      for (const row of result.results ?? []) {
        users.push({
          login: row.login,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
          devices: row.devices ?? 0,
          hasKeys: (row.keys ?? 0) > 0,
          blocked: Boolean(row.blocked),
        });
      }
    }
    const body: AdminUsersResponse = { users };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const env = context.env;
    const body = await readJsonBody(context.request);
    const login = typeof body.login === 'string' ? body.login.trim().toLowerCase() : '';
    const action = body.action;
    if (!login) throw new ApiError('VALIDATION', 400);

    // Себя удалить или заблокировать нельзя: иначе админка останется без владельца.
    if (login === admin.login) throw new ApiError('FORBIDDEN', 403);

    const user = await findUserByLogin(env, login);
    if (!user) throw new ApiError('NOT_FOUND', 404);

    if (action === 'block') {
      await setUserBlocked(env, user.id, true);
      await deleteUserSessions(env, user.id);
      await logAdminAction(env, admin, 'user.block', login);
    } else if (action === 'unblock') {
      await setUserBlocked(env, user.id, false);
      await logAdminAction(env, admin, 'user.unblock', login);
    } else if (action === 'delete') {
      await deleteUser(env, user.id);
      await logAdminAction(env, admin, 'user.delete', login);
    } else {
      throw new ApiError('VALIDATION', 400);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
