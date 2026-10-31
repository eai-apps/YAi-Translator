/**
 * Единственное место, где заданы модели ИИ, URL сервисов и лимиты.
 * Меняя модель или лимит, правьте только этот файл.
 */

export { LANGUAGES, LANGUAGE_CODES, getLanguage, isLanguageCode, isUiLanguage } from '../../shared/languages';

import { CLASSIC_PROVIDERS } from '../../shared/types';

export const APP_VERSION = '0.10.2';

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
export const PROMPT_VERSION = '9';

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
  maxOutputTokens: 12288,
  timeoutMs: 22_000,
} as const;

export const GROQ = {
  url: 'https://api.groq.com/openai/v1/chat/completions',
  models: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'],
  maxOutputTokens: 6144,
  timeoutMs: 20_000,
} as const;

export const DEEPL = {
  /**
   * У бесплатного ключа (оканчивается на «:fx») свой адрес api-free, у остальных тарифов
   * (Developer, Growth, Pro) — api. Используй только deeplUrl() ниже.
   */
  freeBase: 'https://api-free.deepl.com/v2',
  paidBase: 'https://api.deepl.com/v2',
  timeoutMs: 15_000,
} as const;

export const LARA = {
  /**
   * Lara Translate API (раздел «Translate Text» в developers.laratranslate.com).
   * Авторизация: POST {baseUrl}/v2/auth с подписью Lara:<HMAC>, затем POST {baseUrl}/v2/translate.
   */
  baseUrl: 'https://api.laratranslate.com',
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
  /** Подпись запросов: без User-Agent часть сервисов отклоняет запросы из Cloudflare Workers. */
  userAgent: 'YAi-Translator/0.4 (+https://yai-translator.pages.dev/about)',
  /** MyMemory принимает до 500 байт за запрос; берём с запасом. */
  myMemoryMaxBytes: 450,
  /** Больше кусков не отправляем, чтобы не съесть дневной лимит MyMemory одним текстом. */
  myMemoryMaxChunks: 8,
  m2m100Model: '@cf/meta/m2m100-1.2b',
} as const;

/**
 * Резервные общие ключи (версия 0.4.0).
 * Ключи берутся из переменных Cloudflare (GEMINI_API_KEY, GEMINI_API_KEY_2 … _5 — так же для
 * Groq, DeepL, Microsoft, Google и Lara) и из таблицы site_keys (добавлены в админке).
 * Исчерпанный ключ (429) «отдыхает» до 00:00 UTC, неверный (401/403) помечается и больше не используется.
 */
export const KEY_POOL = {
  /** Сколько ключей одного сервиса брать из переменных окружения: KEY, _2, _3 … */
  maxEnvKeys: 5,
  /**
   * Количество ключей в админке не ограничено: можно добавить сколько угодно
   * на каждый сервис (Gemini, Groq, DeepL, Microsoft, Google, Lara).
   */
} as const;

/** Админка (версия 0.4.0): доступ по списку логинов в секрете ADMIN_LOGINS. */
export const ADMIN = {
  /** Сколько последних пользователей показывать в списке. */
  maxUsersListed: 500,
  /** Сколько действий админов хранить в журнале. */
  maxLogEntries: 500,
  /** Сколько дней показывать на графике. */
  chartDays: 30,
  /** Максимальная длина строки баннера. */
  maxBannerLength: 280,
  /** Длина адреса обратной связи в настройках. */
  maxFeedbackEmailLength: 120,
  /** Границы дневного лимита, который можно задать в админке. */
  minDailyLimit: 1,
  maxDailyLimit: 10_000,
  /** Посетители считаются по хешу «IP + день»; старые отметки чистятся. */
  visitorRetentionDays: 120,
} as const;

/**
 * Настоящие словари (версия 0.5.0, папка functions/_lib/dict/).
 * Все адреса — по документации самих сервисов; при смене правьте только этот блок.
 */
export const DICT = {
  /** Wiktionary REST (значения, род, формы). */
  wiktionaryApi: 'https://en.wiktionary.org/api/rest_v1/page/definition',
  /** Немецкий Wiktionary: страница в HTML (род, падежи, глагольные формы, IPA). */
  wiktionaryHtml: 'https://de.wiktionary.org/api/rest_v1/page/html',
  /** Статья для ссылки «Wiktionary» в подписи источника. */
  wiktionaryPage: 'https://de.wiktionary.org/wiki',
  /** OpenThesaurus: немецкие синонимы (только язык de). */
  openThesaurusApi: 'https://www.openthesaurus.de/synonyme/search',
  openThesaurusPage: 'https://www.openthesaurus.de',
  /** Tatoeba API v1: настоящие примеры с переводом. */
  tatoebaApi: 'https://api.tatoeba.org/v1/sentences',
  tatoebaPage: 'https://tatoeba.org/de/sentences/show',
  /** PONS API: словарная статья DE↔RU/EN. Ключ необязательный (PONS_API_KEY). */
  ponsApi: 'https://api.pons.com/v1/dictionary',
  ponsPage: 'https://de.pons.com',
  /** Немецкий словарь DWDS — для толкования слова (страница HTML, без ключа). */
  dwdsPage: 'https://www.dwds.de',
  /** Каждый источник ждём не дольше 6 секунд. */
  timeoutMs: 6_000,
  /** Ответ карточки кэшируется в D1 на 30 дней. */
  cacheTtlSeconds: 60 * 60 * 24 * 30,
  /** Запросы к OpenThesaurus не чаще 60 в минуту: ответ держим в D1 30 дней. */
  maxSenses: 8,
  maxSynonyms: 12,
  maxExamples: 4,
  maxDefinitions: 6,
  maxForms: 10,
  /** Подпись в User-Agent (требование OpenThesaurus: контакт в каждом запросе). */
  userAgent: 'YAi-Translator/0.5 (+https://yai-translator.pages.dev/about)',
} as const;

/** Полезные ресурсы и настройки этапа 4. */
export const RESOURCES = {
  /** Сколько ссылок показывать в одном списке. */
  maxItems: 300,
  maxTitleLength: 120,
  maxUrlLength: 500,
  maxDescriptionLength: 400,
  /** Ответ с ресурсами кэшируется в D1 на 10 минут: в админке изменения видны быстро. */
  cacheTtlSeconds: 600,
  cacheKey: 'resources|list',
  /** Переключатель «Показывать в приложениях из магазинов» тоже живёт в settings. */
  showInAppsSetting: 'resources_show_in_apps',
} as const;

/** Справочник грамматики и «Спросить у AI» (версия 0.6.0). */
export const GRAMMAR = {
  /** Язык справочника: сначала немецкий, позже остальные. */
  lang: 'de',
  /** Сколько тем отдавать в списке. */
  maxTopics: 400,
  /** Сколько символов текста темы храним в body_json. */
  maxBodyChars: 20_000,
  /** Сколько связанных тем принимаем от ИИ (списки проверяются по известным slug). */
  maxRelated: 6,
} as const;

/** «Спросить у AI» — учитель в чате. */export const ASK = {
  /** Длина вопроса. */
  maxQuestionLength: 500,
  /**
   * Ответ на одинаковый вопрос живёт в кэше 90 дней: каждый вопрос стоит ИИ
   * один раз на всех — ровно как карточка слова.
   */
  cacheTtlSeconds: 60 * 60 * 24 * 90,
  /** Сколько вопросов помнит история у пользователя (localStorage и аккаунт). */
  historyLimit: 200,
} as const;

/**
 * Подсказки при наборе одного слова (версия 0.8.0, /api/suggest).
 * Источник: Wiktionary opensearch на языке слова (de.wiktionary.org, ru.wiktionary.org …).
 */
export const SUGGEST = {
  /** Сколько подсказок показываем в интерфейсе. */
  maxItems: 6,
  /** Сколько слов просим у Wiktionary (лишние отбрасываем: часть ответа — не начала слов). */
  limit: 8,
  /** Минимальная длина запроса: с одной буквы подсказок нет. */
  minQueryLength: 2,
  /** Ответ держим в D1 30 дней: одно слово стоит одного запроса на всех. */
  cacheTtlSeconds: 60 * 60 * 24 * 30,
  timeoutMs: 6_000,
  /** Подпись запросов, как у словарей (OpenThesaurus просит контакт в User-Agent). */
  userAgent: 'YAi-Translator/0.9 (+https://yai-translator.pages.dev/about)',
} as const;

/** Учёба (версия 0.7.0): карточки, прогресс и слово дня. */
export const STUDY = {
  /** Лимит карточек на аккаунт; совпадает со STUDY_MAX_CARDS в shared/study.ts. */
  maxCardsPerUser: 3000,
  /** Сколько записей можно передать в одном запросе синхронизации. */
  maxItemsPerRequest: 200,
  /** Сколько дней учёбы возвращать (серия и график): года с запасом. */
  maxDayRows: 400,
  /** Защита счётчиков админки от случайных значений. */
  maxPingReviews: 200,
  maxPingExercises: 100,
  /** Слово дня лежит в кэше до конца дня; значение в секундах — минимум. */
  wordOfDayTtlSeconds: 60,
} as const;

/** Транскрипция голоса (версия 0.9.0): Workers AI Whisper. */
export const TRANSCRIBE = {
  /** Максимальный размер аудио в байтах (2 МБ). */
  maxAudioBytes: 2 * 1024 * 1024,
  /** Максимальная длина записи в секундах. */
  maxDurationSec: 30,
  /** Лимит запросов с одного IP в минуту (отдельно от ИИ-лимита). */
  ratePerMinute: 30,
  /** Модель Whisper в Workers AI. */
  model: '@cf/openai/whisper-large-v3-turbo',
} as const;

/** Платные нейросети через OpenAI-совместимый API (версия 0.9.1). */
export const PAID_AI = {
  /** Максимальная длина Base URL. */
  maxBaseUrlLength: 200,
  /** Максимальная длина ключа. */
  maxKeyLength: 200,
  /** Максимальная длина id модели. */
  maxModelIdLength: 100,
  /** Таймаут, как у Groq. */
  timeoutMs: 20_000,
  /** Максимальный вывод токенов. */
  maxOutputTokens: 8192,
  /** Дневной лимит платных токенов по умолчанию. */
  defaultDailyTokenLimit: 50_000,
  /** Месячный лимит платных токенов по умолчанию. */
  defaultMonthlyTokenLimit: 1_000_000,
} as const;

/** Адрес DeepL для конкретного ключа: path — 'translate' или 'usage'. */
export function deeplUrl(key: string, path: 'translate' | 'usage'): string {
  const base = key.trim().endsWith(':fx') ? DEEPL.freeBase : DEEPL.paidBase;
  return `${base}/${path}`;
}
