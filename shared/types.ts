/**
 * Общие типы API. Используются и фронтендом (src), и бэкендом (functions).
 * Меняя тип, проверьте обе стороны.
 */
import type { LanguageCode, UiLanguage } from './languages';

export type { LanguageCode, UiLanguage };

/** Тип задачи — входит в ключ кэша и определяет промпт. */
export type TaskKind = 'translate' | 'word' | 'explain' | 'check';

/** Провайдер ИИ, который реально ответил. */
export type ProviderId = 'gemini' | 'groq' | 'deepl' | 'workersai';

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

export type ApiErrorCode =
  | 'LIMIT_REACHED'
  | 'VALIDATION'
  | 'TEXT_TOO_LONG'
  | 'RATE_LIMITED'
  | 'NO_PROVIDERS'
  | 'BAD_JSON'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    /** Понятный человеку текст на языке интерфейса запроса. */
    message: string;
    retryAfterSeconds?: number;
  };
}
