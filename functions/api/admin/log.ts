/** GET /api/admin/log — последние действия админов (таблица admin_log). */
import type { AdminLogItem, AdminLogResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { ADMIN } from '../../_lib/config';
import { requireAdmin } from '../../_lib/admin/require';
import { errorResponse, getUiLanguage, jsonResponse } from '../../_lib/http';
import { ensureSchema } from '../../_lib/schema';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const env = context.env;
    const items: AdminLogItem[] = [];
    if (env.DB) {
      await ensureSchema(env);
      const result = await env.DB.prepare('SELECT at, login, action, details FROM admin_log ORDER BY at DESC LIMIT ?')
        .bind(ADMIN.maxLogEntries)
        .all<AdminLogItem>();
      items.push(...(result.results ?? []));
    }
    const body: AdminLogResponse = { items };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
