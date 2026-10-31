/**
 * Все запросы /api/admin/*: сначала вход и права (иначе 401/403), затем эндпоинт.
 * Поэтому ни один административный адрес не открывается без проверки requireAdmin.
 */
import type { Env } from '../../_lib/env';
import { requireAdmin } from '../../_lib/admin/require';
import { errorResponse, getUiLanguage } from '../../_lib/http';

export const onRequest: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  const url = new URL(context.request.url);
  // Эндпоинт прогрева /api/admin/warm вызывается cron-задачей с WARM_TOKEN
  if (url.pathname === '/api/admin/warm') {
    return await context.next();
  }
  try {
    await requireAdmin(context.env, context.request);
    return await context.next();
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
