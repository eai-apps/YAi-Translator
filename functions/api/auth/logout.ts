/** POST /api/auth/logout — выход с этого устройства: сессия удаляется, cookie стирается. */
import type { Env } from '../../_lib/env';
import { clearSessionCookie, deleteSession, hashToken, readSessionToken } from '../../_lib/auth/session';
import { errorResponse, getUiLanguage } from '../../_lib/http';
import { jsonResponseWithCookie } from '../../_lib/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    // Нет токена — выходить не из чего, но ответ всё равно успешный.
    const token = readSessionToken(context.request);
    if (token) await deleteSession(context.env, await hashToken(token));
    return jsonResponseWithCookie({ ok: true }, clearSessionCookie());
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
