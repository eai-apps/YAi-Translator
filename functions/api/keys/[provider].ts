/**
 * PUT    /api/keys/:provider {key} — проверяет ключ настоящим запросом и,
 *                                   только если он рабочий, шифрует и сохраняет в аккаунт.
 * DELETE /api/keys/:provider      — удаляет сохранённый ключ.
 */
import type { SaveKeyResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { deleteUserKey, saveUserKey } from '../../_lib/auth/keys';
import { checkProviderKey } from '../../_lib/keytest';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { requireKeysAccess } from './_guard';

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const { session, provider } = await requireKeysAccess(
      context.env,
      context.request,
      context.params.provider,
    );
    const body = await readJsonBody(context.request);
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    if (!key || key.length > 300) throw new ApiError('VALIDATION', 400);

    // Сначала настоящая проверка: битый или чужой ключ в аккаунт не попадает.
    const check = await checkProviderKey(provider, key, uiLang);
    if (!check.ok) throw new ApiError('KEY_NO_ACCESS', 400);

    const saved = await saveUserKey(context.env, session.userId, provider, key);
    const response: SaveKeyResponse = { key: saved };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const { session, provider } = await requireKeysAccess(
      context.env,
      context.request,
      context.params.provider,
    );
    await deleteUserKey(context.env, session.userId, provider);
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
