/**
 * Публичные настройки сайта для всех посетителей: баннер-объявление, дневной лимит
 * и почта обратной связи (этап 8).
 * GET /api/site-settings
 */
import type { SiteSettingsResponse } from '../../shared/types';
import { APP_VERSION, LIMITS } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { bannerText, readBanner, readDailyLimit, readFeedbackEmail, readSetting, readWhatsNew, SETTINGS_KEYS } from '../_lib/settings';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const [banner, dailyLimit, feedbackEmail, guestLimit, regLimit, requiresLogin, whatsNew, wordCardAuto] = await Promise.all([
      readBanner(env),
      readDailyLimit(env),
      readFeedbackEmail(env),
      readSetting<number>(env, SETTINGS_KEYS.guestAiLimit),
      readSetting<number>(env, SETTINGS_KEYS.registeredAiLimit),
      readSetting<boolean>(env, SETTINGS_KEYS.aiRequiresLogin),
      readWhatsNew(env),
      readSetting<boolean>(env, SETTINGS_KEYS.wordCardAuto),
    ]);
    const text = bannerText(banner, uiLang);
    const whatsNewText = whatsNew.enabled
      ? (whatsNew[uiLang] || whatsNew.ru || whatsNew.en || whatsNew.de || '')
      : '';

    const body: SiteSettingsResponse = {
      version: APP_VERSION,
      dailyLimit: dailyLimit ?? LIMITS.freeRequestsPerDay,
      banner: text ? { ru: bannerText(banner, 'ru'), de: bannerText(banner, 'de'), en: bannerText(banner, 'en') } : null,
      feedbackEmail: feedbackEmail || null,
      guestAiLimit: guestLimit ?? 5,
      registeredAiLimit: regLimit ?? 50,
      aiRequiresLogin: requiresLogin ?? false,
      wordCardAuto: wordCardAuto ?? false,
      whatsNew: whatsNew.enabled && whatsNewText ? { version: whatsNew.version || APP_VERSION, text: whatsNewText } : null,
    };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
