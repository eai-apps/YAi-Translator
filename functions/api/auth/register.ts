/**
 * POST /api/auth/register {login, password, device?} — создаёт аккаунт и сразу входит.
 * Если в запросе есть заголовки X-User-Gemini-Key / X-User-Groq-Key, ключи с устройства
 * переносятся в аккаунт (только если на сервере есть KEY_ENCRYPTION_SECRET).
 */
import type { AuthResponse, KeyProvider } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { buildAccountInfo } from '../../_lib/auth/account';
import { isKeysStorageEnabled } from '../../_lib/auth/crypto';
import { saveUserKey } from '../../_lib/auth/keys';
import { registerAttempt } from '../../_lib/auth/ratelimit';
import { createSession, sessionCookie } from '../../_lib/auth/session';
import { createUser } from '../../_lib/auth/users';
import {
  deviceFromUserAgent,
  optionalDevice,
  requireLogin,
  requirePassword,
} from '../../_lib/auth/validate';
import { AUTH } from '../../_lib/config';
import { errorResponse, getClientIp, getHeaderKeys, getUiLanguage, readJsonBody } from '../../_lib/http';
import { jsonResponseWithCookie } from '../../_lib/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    await registerAttempt(env, getClientIp(context.request));

    const body = await readJsonBody(context.request);
    const login = requireLogin(body.login);
    const password = requirePassword(body.password, 'PASSWORD_TOO_SHORT');
    const device = optionalDevice(body.device) || deviceFromUserAgent(context.request);

    const user = await createUser(env, login, password);
    const { token, tokenHash } = await createSession(env, user.id, device);

    // Перенос ключей с устройства: ошибка сохранения не должна срывать регистрацию.
    if (isKeysStorageEnabled(env)) {
      const headerKeys = getHeaderKeys(context.request);
      const providers: KeyProvider[] = ['gemini', 'groq'];
      for (const provider of providers) {
        const key = headerKeys[provider];
        if (key) await saveUserKey(env, user.id, provider, key).catch(() => undefined);
      }
    }

    const account = await buildAccountInfo(env, user.id, tokenHash);
    const response: AuthResponse = { account, token };
    return jsonResponseWithCookie(response, sessionCookie(token, AUTH.sessionDays * 24 * 60 * 60));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
