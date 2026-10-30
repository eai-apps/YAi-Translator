/**
 * Настройки клиента. Адрес API берётся из VITE_API_BASE:
 * пусто — тот же домен (обычный сайт), иначе — внешний сервер (приложения Capacitor).
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

/** Версия показывается в профиле; совпадает с package.json. */
export const APP_VERSION = '0.2.0';

export const STORAGE_KEYS = {
  theme: 'yai.theme',
  uiLanguage: 'yai.uiLanguage',
  keys: 'yai.keys',
  sourceLang: 'yai.sourceLang',
  targetLang: 'yai.targetLang',
  history: 'yai.history',
  provider: 'yai.provider',
} as const;

/** Задержка перевода после окончания ввода. */
export const TRANSLATE_DEBOUNCE_MS = 600;

/** Совпадает с LIMITS.maxTextLength на сервере (functions/_lib/config.ts). */
export const MAX_TEXT_LENGTH = 3000;

/** Сколько последних переводов хранится в истории (избранное не удаляется). */
export const HISTORY_LIMIT = 50;

export const HISTORY_STORAGE_LIMIT = 300;

/** Цвета артиклей: der — синий, die — красный, das — зелёный. */
export const ARTICLE_COLORS = {
  der: 'text-der',
  die: 'text-die',
  das: 'text-das',
} as const;
