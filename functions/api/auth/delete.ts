/**
 * POST /api/auth/delete { password }
 * Полное удаление аккаунта самим пользователем (требование App Store / Google Play).
 * Требует подтверждения паролем. Навсегда стирает все данные пользователя из D1:
 * профиль, сессии, ключи, историю, избранное, карточки учёбы, прогресс и списки.
 */
import type { Env } from '../../_lib/env';
import { requireSession } from '../../_lib/auth/require';
import { clearSessionCookie } from '../../_lib/auth/session';
import { deleteUser, findUserById } from '../../_lib/auth/users';
import { verifyPassword } from '../../_lib/auth/password';
import { ApiError, errorResponse, getUiLanguage, readJsonBody } from '../../_lib/http';
import { jsonResponseWithCookie } from '../../_lib/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const session = await requireSession(env, context.request);

    const body = await readJsonBody(context.request);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) {
      throw new ApiError('VALIDATION', 400);
    }

    const user = await findUserById(env, session.userId);
    if (!user) {
      throw new ApiError('NOT_FOUND', 404);
    }

    const ok = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!ok) {
      throw new ApiError('INVALID_CREDENTIALS', 401);
    }

    // Удаляем все записи пользователя
    await deleteUser(env, session.userId);

    return jsonResponseWithCookie({ ok: true }, clearSessionCookie());
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
