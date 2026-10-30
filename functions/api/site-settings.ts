/**
 * Публичные настройки сайта для всех посетителей: баннер-объявление и дневной лимит.
 * GET /api/site-settings
 */
import type { SiteSettingsResponse } from '../../shared/types';
import { APP_VERSION, LIMITS } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { bannerText, readBanner, readDailyLimit } from '../_lib/settings';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const [banner, dailyLimit] = await Promise.all([readBanner(env), readDailyLimit(env)]);
    const text = bannerText(banner, uiLang);
    const body: SiteSettingsResponse = {
      version: APP_VERSION,
      dailyLimit: dailyLimit ?? LIMITS.freeRequestsPerDay,
      banner: text ? { ru: bannerText(banner, 'ru'), de: bannerText(banner, 'de'), en: bannerText(banner, 'en') } : null,
    };
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
