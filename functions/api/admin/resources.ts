/**
 * Ресурсы в админке.
 * GET  /api/admin/resources  — все ссылки (включая скрытые) и переключатель «показывать в приложениях»;
 * POST /api/admin/resources {action, …} — add | update | hide | show | move | delete | showInApps.
 */
import type { AdminResourcesResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { requireAdmin } from '../../_lib/admin/require';
import { errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { handleResourceAction } from '../../_lib/resources/admin';
import { listResources, readShowInApps } from '../../_lib/resources/store';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const body: AdminResourcesResponse = {
      showInApps: await readShowInApps(context.env),
      items: await listResources(context.env, false),
    };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const body = await readJsonBody(context.request);
    return jsonResponse(await handleResourceAction(context.env, admin, body));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
