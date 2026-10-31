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
  /** Расход платных токенов нейросетей сайта (этап 7). */
  paidTokens?: { today: number; month: number; dailyLimit: number; monthlyLimit: number };
  /** Готовые прогретые карточки слов (этап 11). */
  warmedCards?: { ready: number; total: number };
}

export interface AdminSettings {
  /** Дневной лимит бесплатных запросов ИИ на один IP; null — значение по умолчанию из config.ts. */
  dailyLimit: number | null;
  defaultDailyLimit: number;
  banner: { enabled: boolean; ru: string; de: string; en: string };
  /** Переводчики и ИИ, выключенные тумблером (по умолчанию — MyMemory). */
  disabledProviders: string[];
  /** Почта для пункта «Обратная связь» в настройках; пусто — пункт скрыт (этап 8). */
  feedbackEmail: string;
  /** Бонусы за регистрацию и платные нейросети (этап 7). */
  guestAiLimit?: number;
  registeredAiLimit?: number;
  aiRequiresLogin?: boolean;
  paidAiOrder?: 'free_first' | 'paid_first' | 'paid_off';
  paidAiRegisteredOnly?: boolean;
  paidDailyTokenLimit?: number;
  paidMonthlyTokenLimit?: number;
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
  /** Адрес из админки для ссылки mailto: в настройках; null — пункт «Обратная связь» скрыт. */
  feedbackEmail: string | null;
  /** Бонусы за регистрацию (этап 7). */
  guestAiLimit?: number;
  registeredAiLimit?: number;
  aiRequiresLogin?: boolean;
}

export interface PaidModelOption {
  id: string;
  enabled: boolean;
  priceIn?: number;
  priceOut?: number;
  isSlowOrExpensive?: boolean;
  ok?: boolean | null;
  latencyMs?: number | null;
  reply?: string | null;
  error?: string | null;
  checkedAt?: number | null;
}

export interface PaidConnectionItem {
  id: string;
  name: string;
  baseUrl: string;
  mask: string;
  balance?: string | null;
  defaultModel: string;
  models: PaidModelOption[];
  createdAt: number;
}

export interface AdminPaidConnectionsResponse {
  connections: PaidConnectionItem[];
  order: 'free_first' | 'paid_first' | 'paid_off';
  regOnly: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  defaultId?: string | null;
}

export interface BuyLinkItem {
  id: number;
  title: string;
  url: string;
  howtoRu: string;
  howtoDe: string;
  howtoEn: string;
  sort: number;
  hidden: boolean;
}
