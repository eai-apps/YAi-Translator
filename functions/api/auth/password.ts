/**
 * POST /api/auth/password {oldPassword, newPassword} — смена пароля.
 * Все другие устройства выходят: текущее остаётся залогиненным.
 */
import type { AccountInfo } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { buildAccountInfo } from '../../_lib/auth/account';
import { deleteUserSessions } from '../../_lib/auth/session';
import { requireSession } from '../../_lib/auth/require';
import { findUserById, changePassword } from '../../_lib/auth/users';
import { requirePassword } from '../../_lib/auth/validate';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const session = await requireSession(env, context.request);
    const body = await readJsonBody(context.request);

    if (typeof body.oldPassword !== 'string') throw new ApiError('VALIDATION', 400);
    const newPassword = requirePassword(body.newPassword, 'PASSWORD_TOO_SHORT');

    const user = await findUserById(env, session.userId);
    if (!user) throw new ApiError('SESSION_EXPIRED', 401);

    await changePassword(env, user, body.oldPassword, newPassword);
    await deleteUserSessions(env, user.id, session.tokenHash);

    const account: AccountInfo = await buildAccountInfo(env, user.id, session.tokenHash);
    return jsonResponse(account);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
