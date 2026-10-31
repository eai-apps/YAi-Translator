/**
 * Типы админки (версия 0.4.0): ключи сайта, статистика, настройки, пользователи, журнал.
 * Подключаются из shared/types.ts — импортировать напрямую из этого файла не нужно.
 */

/** Сервисы, ключи которых сайт держит на сервере (пункт «Ключи сайта»). */
export const SITE_KEY_PROVIDERS = ['gemini', 'groq', 'deepl', 'microsoft', 'google', 'lara'] as const;
export type SiteKeyProvider = (typeof SITE_KEY_PROVIDERS)[number];

/** Состояние ключа из таблицы key_state. */
export type KeyHealth = 'ok' | 'resting' | 'invalid';

export interface SiteKeyInfo {
  /** Короткий идентификатор ключа: первые 12 символов SHA-256. */
  id: string;
  provider: SiteKeyProvider;
  /** «cloudflare» — переменная окружения (только просмотр); «admin» — добавлен в админке. */
  source: 'cloudflare' | 'admin';
  /** Только вторая половина ключа: ••••1234. */
  mask: string;
  health: KeyHealth;
  /** До какого момента ключ «отдыхает» (мс), null — не отдыхает. */
  exhaustedUntil: number | null;
  lastError: string | null;
  lastUsedAt: number | null;
  addedAt: number | null;
}

export interface AdminSiteKeysResponse {
  /** true — на сервере есть KEY_ENCRYPTION_SECRET, ключи из админки можно добавлять. */
  storageEnabled: boolean;
  keys: SiteKeyInfo[];
}

export interface AdminAddKeyRequest {
  provider: SiteKeyProvider;
  key: string;
  /** Регион нужен только для Microsoft Translator. */
  region?: string;
}

export interface SiteKeyTestResponse {
  ok: boolean;
  latencyMs: number;
  message: string | null;
}

export interface AdminOverview {
  users: { total: number; today: number; week: number; month: number; activeWeek: number };
  visitors: { today: number; week: number; month: number };
  /** Переводы за сегодня по сервисам. */
  translationsToday: Record<string, number>;
  translationsTodayTotal: number;
  /** Доля ответов из кэша за сегодня, 0…1. */
  cacheHitRate: number;
  aiRequestsToday: number;
  /** Учёба за сегодня (этап 6): повторённые карточки и сделанные упражнения. */
  study: { reviewsToday: number; exercisesToday: number };
  popularPairs: Array<{ from: string; to: string; count: number }>;
  /** Последние 30 дней начиная с самого раннего: переводы и уникальные посетители. */
  daily: Array<{ day: string; translations: number; visitors: number }>;
}

export interface AdminSettings {
  /** Дневной лимит бесплатных запросов ИИ на один IP; null — значение по умолчанию из config.ts. */
  dailyLimit: number | null;
  defaultDailyLimit: number;
  banner: { enabled: boolean; ru: string; de: string; en: string };
  /** Переводчики и ИИ, выключенные тумблером (по умолчанию — MyMemory). */
  disabledProviders: string[];
}

export interface AdminUserItem {
  login: string;
  createdAt: number;
  lastLoginAt: number | null;
  devices: number;
  hasKeys: boolean;
  blocked: boolean;
}

export interface AdminUsersResponse {
  users: AdminUserItem[];
}

export interface AdminLogItem {
  at: number;
  login: string;
  action: string;
  details: string | null;
}

export interface AdminLogResponse {
  items: AdminLogItem[];
}

/** Публичные настройки сайта: баннер-объявление и дневной лимит. */
export interface SiteSettingsResponse {
  version: string;
  dailyLimit: number;
  banner: { ru: string; de: string; en: string } | null;
}
