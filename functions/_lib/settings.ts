/**
 * Настройки сайта из админки (таблица settings, ключ → JSON-значение).
 * Сейчас их две: дневной лимит бесплатных запросов ИИ и баннер-объявление на ru/de/en.
 */
import type { UiLanguage } from '../../shared/types';
import { ADMIN, LIMITS } from './config';
import type { Env } from './env';
import { ensureSchema } from './schema';
import { describeError } from './utils';

export const SETTINGS_KEYS = {
  dailyLimit: 'daily_limit',
  banner: 'banner',
} as const;

/** Баннер: включён + текст на трёх языках интерфейса. */
export interface BannerSettings {
  enabled: boolean;
  ru: string;
  de: string;
  en: string;
}

export const EMPTY_BANNER: BannerSettings = { enabled: false, ru: '', de: '', en: '' };

export async function readSetting<T>(env: Env, key: string): Promise<T | null> {
  if (!env.DB) return null;
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind(key)
      .first<{ value: string }>();
    if (!row) return null;
    return JSON.parse(row.value) as T;
  } catch (error) {
    console.warn('Настройка не прочитана:', describeError(error));
    return null;
  }
}

export async function writeSetting(env: Env, key: string, value: unknown): Promise<void> {
  if (!env.DB) throw new Error('D1 недоступна — настройка не сохранена');
  await ensureSchema(env);
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  )
    .bind(key, JSON.stringify(value), Date.now())
    .run();
}

/** Дневной лимит: из админки, иначе значение по умолчанию из config.ts. */
export async function readDailyLimit(env: Env): Promise<number> {
  const stored = await readSetting<number>(env, SETTINGS_KEYS.dailyLimit);
  if (typeof stored !== 'number' || !Number.isFinite(stored)) return LIMITS.freeRequestsPerDay;
  return clampDailyLimit(stored);
}

export function clampDailyLimit(value: number): number {
  return Math.min(ADMIN.maxDailyLimit, Math.max(ADMIN.minDailyLimit, Math.round(value)));
}

export async function readBanner(env: Env): Promise<BannerSettings> {
  const stored = await readSetting<Partial<BannerSettings>>(env, SETTINGS_KEYS.banner);
  if (!stored) return EMPTY_BANNER;
  return {
    enabled: Boolean(stored.enabled),
    ru: typeof stored.ru === 'string' ? stored.ru : '',
    de: typeof stored.de === 'string' ? stored.de : '',
    en: typeof stored.en === 'string' ? stored.en : '',
  };
}

/** Текст баннера на языке интерфейса; пусто — показывать нечего. */
export function bannerText(banner: BannerSettings, uiLang: UiLanguage): string {
  if (!banner.enabled) return '';
  const text = banner[uiLang] || banner.en || banner.ru || banner.de;
  return text.trim().slice(0, ADMIN.maxBannerLength);
}

/** Проверка и очистка баннера перед сохранением. */
export function normalizeBanner(value: unknown): BannerSettings {
  const source = (value ?? {}) as Record<string, unknown>;
  const text = (raw: unknown): string => (typeof raw === 'string' ? raw.trim().slice(0, ADMIN.maxBannerLength) : '');
  const banner: BannerSettings = {
    enabled: Boolean(source.enabled),
    ru: text(source.ru),
    de: text(source.de),
    en: text(source.en),
  };
  // Включённый баннер без текста никому не нужен.
  if (!banner.ru && !banner.de && !banner.en) banner.enabled = false;
  return banner;
}
