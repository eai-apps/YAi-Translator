/**
 * Настройки сайта из админки (таблица settings, ключ → JSON-значение).
 * Сейчас их две: дневной лимит бесплатных запросов ИИ и баннер-объявление на ru/de/en.
 */
import type { ProviderId, UiLanguage } from '../../shared/types';
import { ADMIN, LIMITS } from './config';
import type { Env } from './env';
import { ensureSchema } from './schema';
import { describeError } from './utils';

export const SETTINGS_KEYS = {
  dailyLimit: 'daily_limit',
  banner: 'banner',
  disabledProviders: 'disabled_providers',
  /** Почта для пункта «Обратная связь» в настройках (этап 8). */
  feedbackEmail: 'feedback_email',
  /** Почта для MyMemory API (до 50 000 символов/день) (этап 18). */
  mymemoryEmail: 'mymemory_email',
  /** Лимит ИИ для гостей (без аккаунта), по умолчанию 5. */
  guestAiLimit: 'guest_ai_limit',
  /** Лимит ИИ для зарегистрированных, по умолчанию 50. */
  registeredAiLimit: 'registered_ai_limit',
  /** true — ИИ-функции требуют входа в аккаунт. */
  aiRequiresLogin: 'ai_requires_login',
  /** Порядок платных нейросетей: 'free_first' | 'paid_first' | 'paid_off'. */
  paidAiOrder: 'paid_ai_order',
  /** Платные нейросети — только для зарегистрированных (по умолчанию true). */
  paidAiRegisteredOnly: 'paid_ai_registered_only',
  /** Дневной лимит платных токенов. */
  paidDailyTokenLimit: 'paid_daily_token_limit',
  /** Месячный лимит платных токенов. */
  paidMonthlyTokenLimit: 'paid_monthly_token_limit',
  /** Модель нейросети по умолчанию для всего сайта («connId|model»). */
  paidDefaultModel: 'paid_default_model',
  /** Номер строки прогрева карточек популярных слов (этап 11). */
  warmCardsCursor: 'warm_cards_cursor',
  /** Тексты «Что нового» (этап 20). */
  whatsNew: 'whats_new',
  wordCardAuto: 'word_card_auto',
} as const;

/** Простая проверка адреса: без @ или пробелов ничего не сохраняем. */
export function normalizeFeedbackEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim().slice(0, ADMIN.maxFeedbackEmailLength);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text) ? text : '';
}

export async function readFeedbackEmail(env: Env): Promise<string> {
  const stored = await readSetting<string>(env, SETTINGS_KEYS.feedbackEmail);
  return normalizeFeedbackEmail(stored ?? '');
}

/**
 * Переводчики, выключенные тумблером в админке. MyMemory выключен по умолчанию:
 * его база частично наполняется кем угодно, и иногда в ответ приходит мусор.
 */
export const DEFAULT_DISABLED_PROVIDERS: ProviderId[] = ['mymemory'];

const ALL_PROVIDERS: ProviderId[] = [
  'gemini', 'groq', 'workersai', 'deepl', 'lara', 'microsoft', 'google', 'mymemory', 'lingva', 'apertium', 'm2m100',
];

let disabledMemo: { at: number; value: Set<ProviderId> } | null = null;

/** Выключенные переводчики (чтение из D1 не чаще раза в 30 секунд на сервер). */
export async function readDisabledProviders(env: Env): Promise<Set<ProviderId>> {
  if (disabledMemo && Date.now() - disabledMemo.at < 30_000) return disabledMemo.value;
  const stored = await readSetting<string[]>(env, SETTINGS_KEYS.disabledProviders);
  const list = Array.isArray(stored) ? stored : DEFAULT_DISABLED_PROVIDERS;
  const value = new Set(list.filter((id): id is ProviderId => (ALL_PROVIDERS as string[]).includes(id)));
  disabledMemo = { at: Date.now(), value };
  return value;
}

export async function isProviderEnabled(env: Env, id: ProviderId): Promise<boolean> {
  return !(await readDisabledProviders(env)).has(id);
}

export async function writeDisabledProviders(env: Env, list: unknown): Promise<ProviderId[]> {
  const clean = Array.isArray(list)
    ? [...new Set(list.filter((id): id is ProviderId => (ALL_PROVIDERS as string[]).includes(id as string)))]
    : [];
  await writeSetting(env, SETTINGS_KEYS.disabledProviders, clean);
  disabledMemo = null;
  return clean;
}

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

/** Настройки «Что нового» (этап 20): заголовок/версия + текст на трёх языках. */
export interface WhatsNewSettings {
  enabled: boolean;
  version: string;
  ru: string;
  de: string;
  en: string;
}

export const EMPTY_WHATS_NEW: WhatsNewSettings = {
  enabled: false,
  version: '',
  ru: '',
  de: '',
  en: '',
};

export async function readWhatsNew(env: Env): Promise<WhatsNewSettings> {
  const stored = await readSetting<Partial<WhatsNewSettings>>(env, SETTINGS_KEYS.whatsNew);
  if (!stored) return EMPTY_WHATS_NEW;
  return {
    enabled: Boolean(stored.enabled),
    version: typeof stored.version === 'string' ? stored.version.trim() : '',
    ru: typeof stored.ru === 'string' ? stored.ru : '',
    de: typeof stored.de === 'string' ? stored.de : '',
    en: typeof stored.en === 'string' ? stored.en : '',
  };
}

export function normalizeWhatsNew(value: unknown): WhatsNewSettings {
  const source = (value ?? {}) as Record<string, unknown>;
  const text = (raw: unknown): string => (typeof raw === 'string' ? raw.trim().slice(0, 4000) : '');
  const whatsNew: WhatsNewSettings = {
    enabled: Boolean(source.enabled),
    version: typeof source.version === 'string' ? source.version.trim().slice(0, 30) : '',
    ru: text(source.ru),
    de: text(source.de),
    en: text(source.en),
  };
  if (!whatsNew.ru && !whatsNew.de && !whatsNew.en) whatsNew.enabled = false;
  return whatsNew;
}
