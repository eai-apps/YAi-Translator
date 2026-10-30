/** Проверка входных данных запросов и построение ключа кэша. */
import type { LanguageCode, SourceLanguage, TaskKind, UiLanguage } from '../../shared/types';
import { isLanguageCode } from '../../shared/languages';
import { LIMITS, PROMPT_VERSION } from './config';
import { ApiError } from './http';
import { sha256Hex } from './utils';

/** Читает и проверяет текст запроса. */
export function requireText(value: unknown, maxLength: number = LIMITS.maxTextLength): string {
  if (typeof value !== 'string') throw new ApiError('VALIDATION', 400);
  const text = value.trim();
  if (!text) throw new ApiError('VALIDATION', 400);
  if (text.length > maxLength) throw new ApiError('TEXT_TOO_LONG', 413);
  return text;
}

/** Язык перевода (только из списка). */
export function requireLanguage(value: unknown): LanguageCode {
  if (!isLanguageCode(value)) throw new ApiError('VALIDATION', 400);
  return value;
}

/** Исходный язык: конкретный язык или автоопределение. */
export function requireSourceLanguage(value: unknown): SourceLanguage {
  if (value === 'auto') return 'auto';
  return requireLanguage(value);
}

export function requireUiLanguage(value: unknown): UiLanguage {
  if (value === 'ru' || value === 'de' || value === 'en') return value;
  return 'ru';
}

/** Одинаковый запрос с теми же языками получает один и тот же ключ кэша. */
export async function buildCacheKey(parts: {
  kind: TaskKind;
  text: string;
  sourceLang: SourceLanguage;
  targetLang?: LanguageCode;
  uiLang?: UiLanguage;
}): Promise<string> {
  const normalized = [
    'v' + PROMPT_VERSION,
    parts.kind,
    parts.sourceLang,
    parts.targetLang ?? '-',
    parts.uiLang ?? '-',
    parts.text.trim().toLowerCase().replace(/\s+/g, ' '),
  ].join('|');
  return `${parts.kind}:${await sha256Hex(normalized)}`;
}
