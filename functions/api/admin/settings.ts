/**
 * Настройки сайта.
 * GET  /api/admin/settings — дневной лимит и баннер (только для админа).
 * PUT  /api/admin/settings {dailyLimit, banner} — сохранить.
 */
import type { AdminSettings } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { ADMIN, LIMITS } from '../../_lib/config';
import { logAdminAction, requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import {
  clampDailyLimit,
  normalizeBanner,
  readBanner,
  readDisabledProviders,
  readSetting,
  writeDisabledProviders,
  SETTINGS_KEYS,
  writeSetting,
} from '../../_lib/settings';

/** Лимит null — значение по умолчанию (строку из таблицы settings удаляем). */
async function saveDailyLimit(env: Env, limit: number | null): Promise<void> {
  if (!env.DB) throw new Error('D1 недоступна');
  if (limit === null) {
    await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(SETTINGS_KEYS.dailyLimit).run();
    return;
  }
  await writeSetting(env, SETTINGS_KEYS.dailyLimit, clampDailyLimit(limit));
}

async function currentSettings(env: Env): Promise<AdminSettings> {
  const stored = await readSetting<number>(env, SETTINGS_KEYS.dailyLimit);
  const banner = await readBanner(env);
  return {
    dailyLimit: typeof stored === 'number' ? clampDailyLimit(stored) : null,
    defaultDailyLimit: LIMITS.freeRequestsPerDay,
    banner,
    disabledProviders: [...(await readDisabledProviders(env))],
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    return jsonResponse(await currentSettings(context.env));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const env = context.env;
    const body = await readJsonBody(context.request);

    // Дневной лимит: число или null (значение по умолчанию).
    if (body.dailyLimit === null) {
      await saveDailyLimit(env, null);
      await logAdminAction(env, admin, 'settings.limit', 'default');
    } else if (body.dailyLimit !== undefined) {
      const value = Number(body.dailyLimit);
      if (!Number.isFinite(value) || value < ADMIN.minDailyLimit || value > ADMIN.maxDailyLimit) {
        throw new ApiError('VALIDATION', 400);
      }
      await saveDailyLimit(env, value);
      await logAdminAction(env, admin, 'settings.limit', String(clampDailyLimit(value)));
    }

    // Тумблеры переводчиков: список выключенных.
    if (body.disabledProviders !== undefined) {
      const list = await writeDisabledProviders(env, body.disabledProviders);
      await logAdminAction(env, admin, 'settings.providers', list.join(',') || 'all-on');
    }

    // Баннер-объявление на ru/de/en.
    if (body.banner !== undefined) {
      const banner = normalizeBanner(body.banner);
      await writeSetting(env, SETTINGS_KEYS.banner, banner);
      await logAdminAction(env, admin, 'settings.banner', banner.enabled ? 'on' : 'off');
    }

    return jsonResponse(await currentSettings(env));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
