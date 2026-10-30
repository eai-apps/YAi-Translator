/**
 * Единственное место, где заданы модели ИИ, URL сервисов и лимиты.
 * Меняя модель или лимит, правьте только этот файл.
 */

export { LANGUAGES, LANGUAGE_CODES, getLanguage, isLanguageCode, isUiLanguage } from '../../shared/languages';

import { CLASSIC_PROVIDERS } from '../../shared/types';

export const APP_VERSION = '0.3.0';

export const LIMITS = {
  /** Максимальная длина текста для перевода и разбора. */
  maxTextLength: 3000,
  /** Максимальная длина одного слова для карточки. */
  maxWordLength: 60,
  /** Сколько бесплатных запросов в день можно сделать с одного IP на общих ключах. */
  freeRequestsPerDay: 40,
  /** Срок жизни кэша ответов (30 дней). */
  cacheTtlSeconds: 60 * 60 * 24 * 30,
  /** Карточки слов почти не меняются — храним год: каждое слово стоит ИИ один запрос на всех. */
  wordCacheTtlSeconds: 60 * 60 * 24 * 365,
  /** Карточка строится для 1–3 слов («aufstehen», «sich freuen auf»). */
  maxWordsForCard: 3,
  /** Сколько последних ответов держать в кэше (чистка при переполнении не нужна, есть TTL). */
  maxCachedPayloadBytes: 120_000,
} as const;

/** Версия промптов: меняется вместе с prompts.ts и автоматически сбрасывает кэш. */
export const PROMPT_VERSION = '2';

/** Аккаунт, сессии и синхронизация избранного (этап 2). */
export const AUTH = {
  /** Логин: 3–32 символа, латиница, цифры, _ . - (регистр не важен). */
  loginPattern: /^[a-z0-9_.-]{3,32}$/,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  /** PBKDF2-SHA256. Cloudflare Workers разрешает не больше 100 000 итераций. */
  pbkdf2Iterations: 100_000,
  saltBytes: 16,
  hashBytes: 32,
  /** Случайный токен сессии 32 байта; в базе — только SHA-256 от него. */
  tokenBytes: 32,
  sessionDays: 90,
  /** Cookie сессии для сайта. */
  cookieName: 'yai_session',
  /** Не больше 10 попыток входа или регистрации с одного IP за 15 минут. */
  maxAttemptsPerWindow: 10,
  attemptWindowMs: 15 * 60 * 1000,
  /** Сколько последних устройств показывать в профиле. */
  maxSessionsListed: 10,
  /** Сколько записей можно передать в одном запросе синхронизации. */
  maxSyncItemsPerRequest: 200,
  /** Максимум записей избранного и истории на один аккаунт (удалённые чистятся первыми). */
  maxSyncItemsPerUser: 3000,
  /** Размер одной записи избранного/истории в байтах. */
  maxSyncPayloadBytes: 8_000,
} as const;

/** Проверка общих ключей сайта через /api/health?check=1. */
export const HEALTH_CHECK = {
  timeoutMs: 8_000,
  /** Результат проверки кэшируется, чтобы кнопкой нельзя было жечь лимиты сервисов. */
  cacheTtlSeconds: 600,
  maxCachedPayloadBytes: 20_000,
  /** Короткий текст для проверки перевода. */
  sampleText: 'Hallo',
} as const;

export const GEMINI = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  /**
   * Первая модель — самая дешёвая и быстрая, остальные — запасные.
   * Модели 2.5 Google больше не выдаёт новым ключам, поэтому основные — 3.x.
   */
  models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'],
  /** Модели 3.x «думают» перед ответом, это тоже тратит токены — запас побольше. */
  maxOutputTokens: 8192,
  timeoutMs: 20_000,
} as const;

export const GROQ = {
  url: 'https://api.groq.com/openai/v1/chat/completions',
  models: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'],
  maxOutputTokens: 4096,
  timeoutMs: 20_000,
} as const;

export const DEEPL = {
  url: 'https://api-free.deepl.com/v2/translate',
  timeoutMs: 15_000,
} as const;

export const WORKERS_AI = {
  model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  timeoutMs: 25_000,
  maxOutputTokens: 4096,
} as const;

/**
 * Обычные переводчики без ИИ — запасной путь, когда лимиты ИИ закончились.
 * Порядок = приоритет. Сервис без ключа просто пропускается.
 */
export const CLASSIC = {
  order: CLASSIC_PROVIDERS,
  timeoutMs: 12_000,
  microsoftUrl: 'https://api.cognitive.microsofttranslator.com/translate',
  googleUrl: 'https://translation.googleapis.com/language/translate/v2',
  myMemoryUrl: 'https://api.mymemory.translated.net/get',
  /** MyMemory принимает до 500 байт за запрос; берём с запасом. */
  myMemoryMaxBytes: 450,
  /** Больше кусков не отправляем, чтобы не съесть дневной лимит MyMemory одним текстом. */
  myMemoryMaxChunks: 8,
  m2m100Model: '@cf/meta/m2m100-1.2b',
} as const;
