/**
 * POST /api/auth/logout-all — выход со всех устройств.
 * Текущее устройство тоже выходит: cookie стирается вместе с остальными сессиями.
 */
import type { Env } from '../../_lib/env';
import { clearSessionCookie, deleteUserSessions } from '../../_lib/auth/session';
import { requireSession } from '../../_lib/auth/require';
import { errorResponse, getUiLanguage } from '../../_lib/http';
import { jsonResponseWithCookie } from '../../_lib/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const session = await requireSession(context.env, context.request);
    await deleteUserSessions(context.env, session.userId);
    return jsonResponseWithCookie({ ok: true }, clearSessionCookie());
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
