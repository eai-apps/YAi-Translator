/** Общие помощники для проверки ответов ИИ: аккуратно достаём поля нужного типа. */
import type { CefrLevel, CorrectionType, GrammaticalCase, PartOfSpeech, TranslationStyle } from '../../../shared/types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asText(value: unknown, maxLength = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function asArray(value: unknown, maxItems = 20): unknown[] {
  return Array.isArray(value) ? value.slice(0, maxItems) : [];
}

export function asStringList(value: unknown, maxItems = 8): string[] {
  return asArray(value, maxItems)
    .map((item) => asText(item, 200))
    .filter((item) => item.length > 0);
}

export function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const STYLES: readonly TranslationStyle[] = ['neutral', 'colloquial', 'formal'];

export const POS: readonly PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'numeral',
  'interjection',
  'phrase',
  'other',
];

export const CASES: readonly GrammaticalCase[] = [
  'nominative',
  'accusative',
  'dative',
  'genitive',
];

export const LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2'];

export const CORRECTION_TYPES: readonly CorrectionType[] = [
  'grammar',
  'spelling',
  'word-order',
  'vocabulary',
  'punctuation',
  'style',
];
