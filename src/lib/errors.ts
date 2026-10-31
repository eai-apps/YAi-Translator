/** Понятные тексты ошибок: код API превращаем в ключ перевода интерфейса. */
import { ApiClientError } from '../api/client';
import type { ClientErrorCode } from '../api/client';

export interface TranslatorError {
  code: ClientErrorCode;
  message: string;
}

export function toTranslatorError(caught: unknown, fallbackMessage: string): TranslatorError {
  if (caught instanceof ApiClientError) return { code: caught.code, message: caught.message };
  return { code: 'INTERNAL', message: fallbackMessage };
}

export function errorMessageKey(code: ClientErrorCode): string {
  switch (code) {
    case 'LIMIT_REACHED':
      return 'errors.limit';
    case 'VALIDATION':
      return 'errors.validation';
    case 'TEXT_TOO_LONG':
      return 'errors.tooLong';
    case 'BAD_JSON':
      return 'errors.badJson';
    case 'RATE_LIMITED':
      return 'errors.rate';
    case 'NETWORK':
      return 'errors.network';
    case 'NOT_FOUND':
      return 'errors.server';
    case 'WORD_NOT_FOUND':
      return 'dict.notFound';
    case 'GRAMMAR_NOT_READY':
      return 'grammar.notReady';
    case 'FORBIDDEN':
      return 'errors.forbidden';
    case 'ACCOUNT_BLOCKED':
      return 'errors.blocked';
    default:
      return 'errors.unknown';
  }
}

/** Ответил ли ИИ (а не обычный переводчик). */
export function isAiProvider(provider: string): boolean {
  return provider === 'gemini' || provider === 'groq' || provider === 'workersai';
}

/** Названия провайдеров для бейджа «Перевод: …». */
export function providerLabel(provider: string): string {
  switch (provider) {
    case 'gemini':
      return 'Gemini';
    case 'groq':
      return 'Groq';
    case 'deepl':
      return 'DeepL';
    case 'lara':
      return 'Lara Translate';
    case 'workersai':
      return 'Cloudflare AI';
    case 'microsoft':
      return 'Microsoft Translator';
    case 'google':
      return 'Google Translate';
    case 'mymemory':
      return 'MyMemory';
    case 'm2m100':
      return 'M2M100 (Cloudflare)';
    default:
      return provider;
  }
}
