/**
 * GET    /api/admin/errors — список последних ошибок клиента (только для администратора).
 * DELETE /api/admin/errors — очистить журнал ошибок.
 */
import type { Env } from '../../_lib/env';
import { logAdminAction, requireAdmin } from '../../_lib/admin/require';
import { errorResponse, getUiLanguage, jsonResponse } from '../../_lib/http';
import { ensureSchema } from '../../_lib/schema';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const uiLang = getUiLanguage(request);

  try {
    await requireAdmin(env, request);

    if (!env.DB) {
      return jsonResponse({ items: [], total: 0 });
    }

    await ensureSchema(env);

    const [rows, countRes] = await Promise.all([
      env.DB.prepare(
        `SELECT id, timestamp, message, stack, url, source, lineno, colno, app_version as appVersion, user_agent as userAgent, user_note as userNote, created_at as createdAt
         FROM client_errors
         ORDER BY timestamp DESC
         LIMIT 100`
      ).all(),
      env.DB.prepare('SELECT COUNT(*) as count FROM client_errors').first<{ count: number }>(),
    ]);

    return jsonResponse({
      items: rows.results || [],
      total: countRes?.count || 0,
    });
  } catch (err) {
    return errorResponse(err, uiLang);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const uiLang = getUiLanguage(request);

  try {
    const admin = await requireAdmin(env, request);

    if (env.DB) {
      await ensureSchema(env);
      await env.DB.prepare('DELETE FROM client_errors').run();
      await logAdminAction(env, admin, 'clear_client_errors', 'Очищен журнал ошибок');
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err, uiLang);
  }
};
