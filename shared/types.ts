/**
 * Общие типы API. Используются и фронтендом (src), и бэкендом (functions).
 * Меняя тип, проверьте обе стороны.
 */
import type { LanguageCode, UiLanguage } from './languages';

// Типы админки живут отдельно и доступны отсюда же: shared/types или shared/admin — без разницы.
export * from './admin';

export type { LanguageCode, UiLanguage };

/** Тип задачи — входит в ключ кэша и определяет промпт. */
export type TaskKind = 'translate' | 'word' | 'explain' | 'check';

/** Провайдер ИИ, который реально ответил. */
/** ИИ: gemini, groq, workersai. Обычные переводчики: deepl, lara, microsoft, google, mymemory, m2m100. */
export type ProviderId =
  | 'gemini'
  | 'groq'
  | 'deepl'
  | 'lara'
  | 'workersai'
  | 'microsoft'
  | 'google'
  | 'mymemory'
  | 'm2m100';

export type SourceLanguage = LanguageCode | 'auto';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'numeral'
  | 'interjection'
  | 'phrase'
  | 'other';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type GrammaticalCase = 'nominative' | 'accusative' | 'dative' | 'genitive';

export type TranslationStyle = 'neutral' | 'colloquial' | 'formal';

/* ------------------------------- Перевод ------------------------------- */

export interface TranslateRequest {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  /**
   * 'classic' (по умолчанию) — обычные переводчики без ИИ; ИИ подключается, только если все они молчат.
   * 'ai' — кнопка «Спросить у AI»: перевод ИИ с альтернативами.
   */
  mode?: 'classic' | 'ai';
  /** Конкретный обычный переводчик, выбранный пользователем (иначе — по очереди). */
  provider?: ProviderId;
}

/** Переводчики, которые пользователь может выбрать вручную. Порядок = приоритет в цепочке. */
export const CLASSIC_PROVIDERS = ['deepl', 'lara', 'microsoft', 'google', 'mymemory', 'm2m100'] as const;
export type ClassicProviderId = (typeof CLASSIC_PROVIDERS)[number];

export interface CompareRequest {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  /** Сервис, который дал основной перевод: в списке он не повторяется. */
  exclude?: ProviderId;
}

export interface CompareItem {
  provider: ProviderId;
  text: string | null;
}

export interface CompareResponse {
  items: CompareItem[];
}

export interface AlternativeTranslation {
  style: TranslationStyle;
  text: string;
}

export interface TranslateResponse {
  translatedText: string;
  alternatives: AlternativeTranslation[];
  /** Язык, определённый автоматически (null, если он был выбран вручную). */
  detectedLang: LanguageCode | null;
  provider: ProviderId;
  cached: boolean;
}

/* ------------------------------ Карточка слова ------------------------------ */

export interface WordRequest {
  word: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
}

export interface WordMeaning {
  /** Оттенок смысла на языке интерфейса (например, «действие»). */
  sense: string;
  translations: string[];
  note: string | null;
}

export interface DeclensionRow {
  grammaticalCase: GrammaticalCase;
  singular: string;
  plural: string;
}

export interface VerbForm {
  pronoun: string;
  form: string;
}

export interface Conjugation {
  praesens: VerbForm[];
  praeteritum: VerbForm[];
  /** Готовая форма Perfekt, например «hat gemacht». */
  perfekt: string;
  auxiliary: 'haben' | 'sein';
}

export interface WordExample {
  level: CefrLevel;
  text: string;
  translation: string;
}

export interface Phrase {
  text: string;
  translation: string;
}

export interface WordCard {
  /** Слово в исходной форме (лемма). */
  lemma: string;
  /** Язык, к которому относится карточка. */
  language: LanguageCode;
  partOfSpeech: PartOfSpeech;
  article: 'der' | 'die' | 'das' | null;
  plural: string | null;
  transcription: string | null;
  meanings: WordMeaning[];
  /** Склонение по 4 падежам (для существительных и прилагательных). */
  declension: DeclensionRow[] | null;
  /** Спряжение (только для глаголов). */
  conjugation: Conjugation | null;
  /** Управление предлогами и падежами, например «warten auf + Akk.». */
  governance: string[];
  examples: WordExample[];
  synonyms: string[];
  antonyms: string[];
  phrases: Phrase[];
  /**
   * Грамматические пояснения на языке интерфейса: возвратный ли глагол, отделяемая ли приставка,
   * почему слова пишутся/стоят вместе, какой союз или предлог требуется.
   */
  grammarNotes: string[];
}

export interface WordResponse {
  card: WordCard;
  provider: ProviderId;
  cached: boolean;
}

/* ---------------------------- Разбор грамматики ---------------------------- */

export interface ExplainRequest {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  uiLang: UiLanguage;
}

export interface ConjunctionNote {
  conjunction: string;
  meaning: string;
  alternatives: string[];
}

export interface CaseNote {
  grammaticalCase: string;
  usage: string;
  example: string;
}

export interface TenseNote {
  tense: string;
  usage: string;
  example: string;
}

export interface MistakeNote {
  wrong: string;
  right: string;
  explanation: string;
}

export interface VocabularyNote {
  word: string;
  translation: string;
  note: string;
}

export interface ExplainResponse {
  summary: string;
  wordOrder: string[];
  conjunctions: ConjunctionNote[];
  cases: CaseNote[];
  tenses: TenseNote[];
  commonMistakes: MistakeNote[];
  vocabulary: VocabularyNote[];
  provider: ProviderId;
  cached: boolean;
}

/* ------------------------- Проверка немецкого текста ------------------------ */

export interface CheckRequest {
  text: string;
  uiLang: UiLanguage;
}

export type CorrectionType =
  | 'grammar'
  | 'spelling'
  | 'word-order'
  | 'vocabulary'
  | 'punctuation'
  | 'style';

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: CorrectionType;
}

export interface CheckResponse {
  correctedText: string;
  isCorrect: boolean;
  corrections: Correction[];
  encouragement: string;
  provider: ProviderId;
  cached: boolean;
}

/* -------------------------------- Служебное -------------------------------- */

/** Проверка сервиса (общего ключа сайта или своего ключа). */
export interface ServiceCheck {
  ok: boolean;
  latencyMs: number;
  /** Понятная причина на языке интерфейса; null, если всё в порядке. */
  message: string | null;
}

export interface HealthResponse {
  ok: boolean;
  version: string;
  time: string;
  providers: Record<ProviderId, boolean>;
  limits: {
    maxTextLength: number;
    freeRequestsPerDay: number;
    cacheTtlHours: number;
  };
  /** Результаты настоящих запросов к сервисам (только при ?check=1). */
  checks?: Partial<Record<ProviderId, ServiceCheck>>;
  /** true, если результат проверки взят из кэша D1 (был запрошен меньше 10 минут назад). */
  checksCached?: boolean;
  /** false — на сервере нет секрета KEY_ENCRYPTION_SECRET, ключи можно хранить только на устройстве. */
  keysStorageEnabled?: boolean;
}

export interface KeyTestRequest {
  provider: 'gemini' | 'groq';
  key: string;
}

export interface KeyTestResponse {
  ok: boolean;
  latencyMs: number;
  message: string | null;
}

/* -------------------------------- Аккаунт -------------------------------- */

/** Провайдеры, ключи которых можно хранить в аккаунте. */
export const KEY_PROVIDERS = ['gemini', 'groq'] as const;
export type KeyProvider = (typeof KEY_PROVIDERS)[number];

export interface AccountSession {
  device: string;
  lastSeenAt: number;
  createdAt: number;
  /** true — это устройство, с которого сделан запрос. */
  current: boolean;
}

/** Сохранённый ключ: сам ключ сервер никогда не возвращает. */
export interface StoredKeyInfo {
  last4: string;
  updatedAt: number;
}

export interface AccountInfo {
  login: string;
  createdAt: number;
  sessions: AccountSession[];
  keys: Record<KeyProvider, StoredKeyInfo | null>;
  keysStorageEnabled: boolean;
  /** true — логин указан в секрете ADMIN_LOGINS; только тогда видна ссылка «Админка». */
  isAdmin: boolean;
}

/** Ответ входа и регистрации. */
export interface AuthResponse {
  account: AccountInfo;
  /** Токен для приложений со своим хранилищем; для сайта сессия уже лежит в cookie. */
  token: string;
}

export interface RegisterRequest {
  login: string;
  password: string;
  /** Название устройства для списка «Мои устройства». */
  device?: string;
}

export interface LoginRequest extends RegisterRequest {}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/** Проверка ключа через /api/key-test. */
export interface KeyCheckRequest {
  provider: KeyProvider;
  key: string;
}

/** Сохранение своего ключа в аккаунт. */
export interface SaveKeyRequest {
  key: string;
}

export interface SaveKeyResponse {
  key: StoredKeyInfo;
}

/* ------------------------- Синхронизация избранного ------------------------- */

/** Одна запись избранного или истории на сервере. */
export interface SyncItem {
  id: string;
  /** JSON-строка с данными записи (HistoryItem на клиенте). */
  payload: string;
  updatedAt: number;
  deleted: boolean;
}

export interface SyncPushRequest {
  items: SyncItem[];
}

export interface SyncResponse {
  /** Записи новее запрошенного since; при первом запросе — все. */
  items: SyncItem[];
  /** Время сервера — передайте его в следующий ?since=. */
  serverTime: number;
}

export type ApiErrorCode =
  | 'LIMIT_REACHED'
  | 'VALIDATION'
  | 'TEXT_TOO_LONG'
  | 'RATE_LIMITED'
  | 'NO_PROVIDERS'
  | 'BAD_JSON'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_TAKEN'
  | 'TOO_MANY_ATTEMPTS'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'LOGIN_INVALID'
  | 'PASSWORD_TOO_SHORT'
  | 'KEYS_STORAGE_DISABLED'
  | 'KEY_NO_ACCESS'
  | 'FORBIDDEN'
  | 'ACCOUNT_BLOCKED';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    /** Понятный человеку текст на языке интерфейса запроса. */
    message: string;
    retryAfterSeconds?: number;
  };
}
