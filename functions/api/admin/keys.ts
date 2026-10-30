/**
 * Ключи сайта в админке.
 * GET  /api/admin/keys                 — список ключей всех сервисов с их состоянием.
 * POST /api/admin/keys {provider,key,region?}  — проверка настоящим запросом и сохранение.
 */
import type { AdminSiteKeysResponse, SiteKeyInfo, SiteKeyProvider } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { isKeysStorageEnabled } from '../../_lib/auth/crypto';
import { addSiteKey, listSiteKeys, testSiteKey } from '../../_lib/admin/sitekeys';
import { logAdminAction, requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { isSiteKeyProvider } from '../../_lib/keypool';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const body: AdminSiteKeysResponse = {
      storageEnabled: isKeysStorageEnabled(context.env),
      keys: await listSiteKeys(context.env),
    };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const env = context.env;
    if (!isKeysStorageEnabled(env)) throw new ApiError('KEYS_STORAGE_DISABLED', 503);

    const body = await readJsonBody(context.request);
    if (!isSiteKeyProvider(body.provider)) throw new ApiError('VALIDATION', 400);
    const provider: SiteKeyProvider = body.provider;

    const key = typeof body.key === 'string' ? body.key.trim() : '';
    const region = typeof body.region === 'string' ? body.region.trim() : '';
    if (key.length < 6 || key.length > 400) throw new ApiError('VALIDATION', 400);

    // Lara требует пару: идентификатор и секрет. Секрет передаётся как key, а идентификатор — нет:
    // поэтому для Lara админка ждёт строку формата «id:secret».
    let accessKey = key;
    let secret: string | undefined;
    if (provider === 'lara') {
      const separator = key.indexOf(':');
      if (separator <= 0) throw new ApiError('VALIDATION', 400);
      accessKey = key.slice(0, separator).trim();
      secret = key.slice(separator + 1).trim();
      if (!accessKey || !secret) throw new ApiError('VALIDATION', 400);
    }

    // Перед сохранением ключ проверяется настоящим запросом.
    const check = await testSiteKey(provider, accessKey, secret, region || undefined);
    if (!check.ok) throw new ApiError('KEY_NO_ACCESS', 422);

    const info: SiteKeyInfo = await addSiteKey(
      env,
      provider,
      accessKey,
      secret,
      provider === 'microsoft' ? region || undefined : undefined,
      admin.login,
    );
    await logAdminAction(env, admin, 'key.add', `${provider} ••••${info.mask.slice(-4)}`);
    return jsonResponse({ key: info });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
