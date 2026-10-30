/**
 * POST /api/auth/login {login, password, device?} — вход.
 * Неверный логин и неверный пароль дают одну и ту же ошибку INVALID_CREDENTIALS.
 */
import type { AuthResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { buildAccountInfo } from '../../_lib/auth/account';
import { registerAttempt } from '../../_lib/auth/ratelimit';
import { createSession, sessionCookie } from '../../_lib/auth/session';
import { authenticate } from '../../_lib/auth/users';
import { deviceFromUserAgent, optionalDevice, normalizeLogin, requirePassword } from '../../_lib/auth/validate';
import { AUTH } from '../../_lib/config';
import { ApiError, errorResponse, getClientIp, getUiLanguage, readJsonBody } from '../../_lib/http';
import { jsonResponseWithCookie } from '../../_lib/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    // Считаем попытку до проверки пароля: подбор нельзя ускорить.
    await registerAttempt(env, getClientIp(context.request));

    const body = await readJsonBody(context.request);
    const login = normalizeLogin(body.login);
    const password = requirePassword(body.password);

    const user = await authenticate(env, login, password);
    if (!user) throw new ApiError('INVALID_CREDENTIALS', 401);

    const device = optionalDevice(body.device) || deviceFromUserAgent(context.request);
    const { token, tokenHash } = await createSession(env, user.id, device);

    const account = await buildAccountInfo(env, user.id, tokenHash);
    const response: AuthResponse = { account, token };
    return jsonResponseWithCookie(response, sessionCookie(token, AUTH.sessionDays * 24 * 60 * 60));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
