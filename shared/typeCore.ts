/**
 * Базовые типы API: коды и мелочи, на которые опираются все остальные файлы типов (версия 0.6.0).
 * Импортировать напрямую отсюда не нужно — всё доступно через shared/types.ts.
 * Файл стоял длиннее 400 строк, поэтому типы разложены по смыслу, а types.ts реэкспортирует их.
 */
import type { LanguageCode } from './languages';

/** Язык ввода: конкретный язык или автоопределение. */
export type SourceLanguage = LanguageCode | 'auto';

/** Уровень CEFR для примеров и карточек слова (этапы 8, 15). */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1+';

export type GrammaticalCase = 'nominative' | 'accusative' | 'dative' | 'genitive';

export type TranslationStyle = 'neutral' | 'colloquial' | 'formal';

/** Коды ошибок API: по коду интерфейс выбирает понятный текст. */
export type ApiErrorCode =
  | 'LIMIT_REACHED'
  | 'VALIDATION'
  | 'TEXT_TOO_LONG'
  | 'RATE_LIMITED'
  | 'NO_PROVIDERS'
  | 'BAD_JSON'
  | 'NOT_FOUND'
  | 'WORD_NOT_FOUND'
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
  | 'ACCOUNT_BLOCKED'
  | 'GRAMMAR_NOT_READY'
  | 'AUDIO_TOO_LARGE'
  | 'AUDIO_REQUIRED';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    /** Понятный человеку текст на языке интерфейса запроса. */
    message: string;
    retryAfterSeconds?: number;
  };
}
