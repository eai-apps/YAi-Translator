/** POST /api/keys/:provider/test — проверяет сохранённый в аккаунте ключ. */
import type { KeyTestResponse } from '../../../../shared/types';
import type { Env } from '../../../_lib/env';
import { readUserKeys } from '../../../_lib/auth/keys';
import { checkProviderKey } from '../../../_lib/keytest';
import { ApiError, errorResponse, getUiLanguage, jsonResponse } from '../../../_lib/http';
import { requireKeysAccess } from '../_guard';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const { session, provider } = await requireKeysAccess(
      context.env,
      context.request,
      context.params.provider,
    );
    const keys = await readUserKeys(context.env, session.userId);
    const key = keys[provider];
    if (!key) throw new ApiError('NOT_FOUND', 404);

    const check = await checkProviderKey(provider, key, uiLang);
    const response: KeyTestResponse = {
      ok: check.ok,
      latencyMs: check.latencyMs,
      message: check.message,
    };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
