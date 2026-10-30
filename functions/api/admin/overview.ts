/** GET /api/admin/overview — вкладка «Обзор»: пользователи, посетители, переводы, график 30 дней. */
import type { AdminOverview } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { buildOverview } from '../../_lib/admin/overview';
import { requireAdmin } from '../../_lib/admin/require';
import { errorResponse, getUiLanguage, jsonResponse } from '../../_lib/http';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const overview: AdminOverview = await buildOverview(context.env);
    return jsonResponse(overview);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
