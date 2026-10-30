/**
 * GET /api/auth/me — данные профиля: логин, дата регистрации, устройства
 * и какие ключи ИИ сохранены (только последние 4 символа, сам ключ не отдаётся).
 */
import type { AccountInfo } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { buildAccountInfo } from '../../_lib/auth/account';
import { requireSession } from '../../_lib/auth/require';
import { errorResponse, getUiLanguage, jsonResponse } from '../../_lib/http';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const session = await requireSession(context.env, context.request);
    const account: AccountInfo = await buildAccountInfo(
      context.env,
      session.userId,
      session.tokenHash,
    );
    return jsonResponse(account);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
