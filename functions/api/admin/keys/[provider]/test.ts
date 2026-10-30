/** POST /api/admin/keys/:provider/test — проверка первого рабочего ключа сервиса. */
import type { SiteKeyTestResponse } from '../../../../../shared/types';
import type { Env } from '../../../../_lib/env';
import { testStoredKey } from '../../../../_lib/admin/sitekeys';
import { logAdminAction, requireAdmin } from '../../../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse } from '../../../../_lib/http';
import { isSiteKeyProvider } from '../../../../_lib/keypool';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const provider = context.params.provider;
    if (!isSiteKeyProvider(provider)) throw new ApiError('NOT_FOUND', 404);

    const result: SiteKeyTestResponse = await testStoredKey(context.env, provider);
    await logAdminAction(context.env, admin, 'key.test', `${provider}: ${result.ok ? 'ok' : 'fail'}`);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
