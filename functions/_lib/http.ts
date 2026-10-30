/** HTTP-помощники: ответы, ошибки, CORS, чтение заголовков. */
import type { ApiErrorBody, ApiErrorCode, UiLanguage } from '../../shared/types';
import { isUiLanguage } from '../../shared/languages';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-UI-Language, X-User-Gemini-Key, X-User-Groq-Key',
  'Access-Control-Max-Age': '86400',
};

/** Ошибка API с понятным кодом и текстом на языке пользователя. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(code: ApiErrorCode, status = 400, retryAfterSeconds?: number) {
    super(ERROR_MESSAGES[code].en);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const ERROR_MESSAGES: Record<ApiErrorCode, Record<UiLanguage, string>> = {
  LIMIT_REACHED: {
    ru: 'Бесплатные попытки на сегодня закончились. Подключите свой бесплатный ключ Gemini или Groq — это занимает минуту.',
    de: 'Die kostenlosen Versuche für heute sind aufgebraucht. Verbinden Sie Ihren eigenen kostenlosen Gemini- oder Groq-Schlüssel — das dauert eine Minute.',
    en: 'The free requests for today are used up. Connect your own free Gemini or Groq key — it takes a minute.',
  },
  VALIDATION: {
    ru: 'Запрос составлен неверно. Обновите страницу и попробуйте снова.',
    de: 'Die Anfrage ist ungültig. Bitte laden Sie die Seite neu und versuchen Sie es erneut.',
    en: 'The request is invalid. Please reload the page and try again.',
  },
  TEXT_TOO_LONG: {
    ru: 'Текст слишком длинный. Сократите его и попробуйте снова.',
    de: 'Der Text ist zu lang. Kürzen Sie ihn und versuchen Sie es erneut.',
    en: 'The text is too long. Shorten it and try again.',
  },
  RATE_LIMITED: {
    ru: 'Слишком много запросов подряд. Подождите несколько секунд.',
    de: 'Zu viele Anfragen in kurzer Zeit. Warten Sie bitte einige Sekunden.',
    en: 'Too many requests in a row. Please wait a few seconds.',
  },
  NO_PROVIDERS: {
    ru: 'Сервис перевода временно недоступен. Попробуйте позже.',
    de: 'Der Übersetzungsdienst ist vorübergehend nicht verfügbar. Versuchen Sie es später.',
    en: 'The translation service is temporarily unavailable. Try again later.',
  },
  BAD_JSON: {
    ru: 'Сервис вернул неожиданный ответ. Попробуйте ещё раз.',
    de: 'Der Dienst hat unerwartet geantwortet. Bitte versuchen Sie es erneut.',
    en: 'The service returned an unexpected answer. Please try again.',
  },
  NOT_FOUND: {
    ru: 'Такой адрес не найден.',
    de: 'Diese Adresse wurde nicht gefunden.',
    en: 'This address was not found.',
  },
  INTERNAL: {
    ru: 'Что-то пошло не так на сервере. Попробуйте ещё раз.',
    de: 'Auf dem Server ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    en: 'Something went wrong on the server. Please try again.',
  },
};

export function messageForError(code: ApiErrorCode, uiLang: UiLanguage): string {
  return ERROR_MESSAGES[code][uiLang];
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function errorResponse(error: unknown, uiLang: UiLanguage): Response {
  const apiError = error instanceof ApiError ? error : new ApiError('INTERNAL', 500);
  if (!(error instanceof ApiError)) {
    console.error('Необработанная ошибка API:', error);
  }
  const body: ApiErrorBody = {
    error: {
      code: apiError.code,
      message: messageForError(apiError.code, uiLang),
      ...(apiError.retryAfterSeconds ? { retryAfterSeconds: apiError.retryAfterSeconds } : {}),
    },
  };
  const response = jsonResponse(body, apiError.status);
  if (apiError.retryAfterSeconds) {
    response.headers.set('Retry-After', String(apiError.retryAfterSeconds));
  }
  return response;
}

/** Читает JSON-тело запроса; пустое или битое тело — ошибка VALIDATION. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError('VALIDATION', 400);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ApiError('VALIDATION', 400);
  }
  return raw as Record<string, unknown>;
}

/** Язык интерфейса из заголовка X-UI-Language или Accept-Language. */
export function getUiLanguage(request: Request): UiLanguage {
  const explicit = request.headers.get('x-ui-language');
  if (isUiLanguage(explicit)) return explicit;

  const accept = (request.headers.get('accept-language') ?? '').toLowerCase();
  if (accept.startsWith('de')) return 'de';
  if (accept.startsWith('en')) return 'en';
  return 'ru';
}

/** Ключи пользователя из заголовков. Сервер их нигде не сохраняет. */
export function getUserKeys(request: Request): { gemini?: string; groq?: string } {
  const gemini = request.headers.get('x-user-gemini-key')?.trim();
  const groq = request.headers.get('x-user-groq-key')?.trim();
  return {
    gemini: gemini && gemini.length <= 300 ? gemini : undefined,
    groq: groq && groq.length <= 300 ? groq : undefined,
  };
}

/** IP посетителя для дневного лимита (в базу попадает только хеш). */
export function getClientIp(request: Request): string {
  const direct = request.headers.get('cf-connecting-ip');
  if (direct) return direct.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
