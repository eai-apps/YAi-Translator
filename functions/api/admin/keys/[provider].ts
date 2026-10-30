/**
 * Работа с одним ключом сервиса.
 * DELETE /api/admin/keys/:provider?id=… — удалить ключ, добавленный в админке.
 * (Проверка ключа — в соседнем файле keys/:provider/test.ts.)
 */
import type { Env } from '../../../_lib/env';
import { deleteSiteKey } from '../../../_lib/admin/sitekeys';
import { logAdminAction, requireAdmin } from '../../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse } from '../../../_lib/http';
import { isSiteKeyProvider } from '../../../_lib/keypool';

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const provider = context.params.provider;
    if (!isSiteKeyProvider(provider)) throw new ApiError('NOT_FOUND', 404);

    const id = new URL(context.request.url).searchParams.get('id') ?? '';
    if (!id) throw new ApiError('VALIDATION', 400);

    const removed = await deleteSiteKey(context.env, provider, id);
    if (!removed) throw new ApiError('NOT_FOUND', 404);
    await logAdminAction(context.env, admin, 'key.delete', provider);
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
