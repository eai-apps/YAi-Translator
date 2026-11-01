/**
 * Настройки сайта.
 * GET  /api/admin/settings — дневной лимит, баннер и почта обратной связи (только для админа).
 * PUT  /api/admin/settings {dailyLimit, banner, disabledProviders, feedbackEmail} — сохранить.
 */
import type { AdminSettings } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { ADMIN, LIMITS } from '../../_lib/config';
import { logAdminAction, requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import {
  clampDailyLimit,
  normalizeBanner,
  normalizeWhatsNew,
  readBanner,
  readDisabledProviders,
  readFeedbackEmail,
  readSetting,
  readWhatsNew,
  writeDisabledProviders,
  SETTINGS_KEYS,
  normalizeFeedbackEmail,
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
  const [stored, banner, whatsNew, guestLimit, regLimit, requiresLogin, mmEmail, wordCardAuto] = await Promise.all([
    readSetting<number>(env, SETTINGS_KEYS.dailyLimit),
    readBanner(env),
    readWhatsNew(env),
    readSetting<number>(env, SETTINGS_KEYS.guestAiLimit),
    readSetting<number>(env, SETTINGS_KEYS.registeredAiLimit),
    readSetting<boolean>(env, SETTINGS_KEYS.aiRequiresLogin),
    readSetting<string>(env, SETTINGS_KEYS.mymemoryEmail),
    readSetting<boolean>(env, SETTINGS_KEYS.wordCardAuto),
  ]);
  return {
    dailyLimit: typeof stored === 'number' ? clampDailyLimit(stored) : null,
    defaultDailyLimit: LIMITS.freeRequestsPerDay,
    banner,
    whatsNew,
    disabledProviders: [...(await readDisabledProviders(env))],
    feedbackEmail: await readFeedbackEmail(env),
    myMemoryEmail: normalizeFeedbackEmail(mmEmail ?? ''),
    guestAiLimit: guestLimit ?? 5,
    registeredAiLimit: regLimit ?? 50,
    aiRequiresLogin: requiresLogin ?? false,
    wordCardAuto: wordCardAuto ?? false,
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

    // Тексты «Что нового» (этап 20).
    if (body.whatsNew !== undefined) {
      const whatsNew = normalizeWhatsNew(body.whatsNew);
      await writeSetting(env, SETTINGS_KEYS.whatsNew, whatsNew);
      await logAdminAction(env, admin, 'settings.whatsNew', whatsNew.enabled ? (whatsNew.version || 'on') : 'off');
    }

    // Почта для «Обратной связи»: пустая строка — пункт в настройках скрыт.
    if (body.feedbackEmail !== undefined) {
      const email = normalizeFeedbackEmail(body.feedbackEmail);
      if (email) await writeSetting(env, SETTINGS_KEYS.feedbackEmail, email);
      else if (env.DB) await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(SETTINGS_KEYS.feedbackEmail).run();
      await logAdminAction(env, admin, 'settings.feedback', email ? 'set' : 'off');
    }

    // Почта для MyMemory API (этап 18): до 50 000 символов/день
    if (body.myMemoryEmail !== undefined) {
      const email = normalizeFeedbackEmail(body.myMemoryEmail);
      if (email) await writeSetting(env, SETTINGS_KEYS.mymemoryEmail, email);
      else if (env.DB) await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(SETTINGS_KEYS.mymemoryEmail).run();
      await logAdminAction(env, admin, 'settings.mymemory', email ? 'set' : 'off');
    }

    if (body.guestAiLimit !== undefined) {
      await writeSetting(env, SETTINGS_KEYS.guestAiLimit, Math.max(1, Math.min(1000, Number(body.guestAiLimit))));
    }
    if (body.registeredAiLimit !== undefined) {
      await writeSetting(env, SETTINGS_KEYS.registeredAiLimit, Math.max(1, Math.min(1000, Number(body.registeredAiLimit))));
    }
    if (body.aiRequiresLogin !== undefined) {
      await writeSetting(env, SETTINGS_KEYS.aiRequiresLogin, Boolean(body.aiRequiresLogin));
    }

    if (body.wordCardAuto !== undefined) {
      await writeSetting(env, SETTINGS_KEYS.wordCardAuto, Boolean(body.wordCardAuto));
    }
    return jsonResponse(await currentSettings(env));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
