/** HTTP-помощники: ответы, ошибки, CORS, чтение заголовков. */
import type { ApiErrorBody, ApiErrorCode, UiLanguage } from '../../shared/types';
import { isUiLanguage } from '../../shared/languages';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-UI-Language, X-User-Gemini-Key, X-User-Groq-Key',
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
  INVALID_CREDENTIALS: {
    ru: 'Неверный логин или пароль. Проверьте и попробуйте снова.',
    de: 'Login oder Passwort ist falsch. Bitte prüfen und erneut versuchen.',
    en: 'Wrong login or password. Please check and try again.',
  },
  TOO_MANY_ATTEMPTS: {
    ru: 'Слишком много попыток входа. Подождите 15 минут и попробуйте снова.',
    de: 'Zu viele Anmeldeversuche. Warten Sie 15 Minuten und versuchen Sie es erneut.',
    en: 'Too many sign-in attempts. Wait 15 minutes and try again.',
  },
  UNAUTHORIZED: {
    ru: 'Сначала войдите в аккаунт.',
    de: 'Bitte melden Sie sich zuerst an.',
    en: 'Please sign in first.',
  },
  SESSION_EXPIRED: {
    ru: 'Вход истёк. Войдите снова — ваши избранное и ключи на месте.',
    de: 'Die Anmeldung ist abgelaufen. Melden Sie sich erneut an — Favoriten und Schlüssel bleiben erhalten.',
    en: 'Your session has expired. Sign in again — your favorites and keys are safe.',
  },
  LOGIN_TAKEN: {
    ru: 'Такой логин уже занят. Выберите другой или войдите с этим.',
    de: 'Dieser Login ist schon vergeben. Wählen Sie einen anderen oder melden Sie sich an.',
    en: 'This login is already taken. Choose another one or sign in with it.',
  },
  LOGIN_INVALID: {
    ru: 'Логин: 3–32 символа, латинские буквы, цифры, точка, дефис и подчёркивание.',
    de: 'Login: 3–32 Zeichen, lateinische Buchstaben, Ziffern, Punkt, Bindestrich und Unterstrich.',
    en: 'Login: 3–32 characters, Latin letters, digits, dot, hyphen and underscore.',
  },
  PASSWORD_TOO_SHORT: {
    ru: 'Пароль должен быть не короче 8 символов.',
    de: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    en: 'The password must be at least 8 characters long.',
  },
  KEYS_STORAGE_DISABLED: {
    ru: 'Хранение ключей в аккаунте сейчас выключено. Ключ можно сохранить на этом устройстве.',
    de: 'Das Speichern von Schlüsseln im Konto ist ausgeschaltet. Der Schlüssel kann auf diesem Gerät gespeichert werden.',
    en: 'Storing keys in the account is turned off right now. The key can be saved on this device.',
  },
  KEY_NO_ACCESS: {
    ru: 'Этот ключ не даёт доступа. Проверьте, что скопировали его целиком и он активен.',
    de: 'Dieser Schlüssel gibt keinen Zugriff. Prüfen Sie, ob Sie ihn vollständig kopiert haben und er aktiv ist.',
    en: 'This key does not grant access. Make sure you copied all of it and that it is active.',
  },
  FORBIDDEN: {
    ru: 'Недостаточно прав: эта страница доступна только администратору.',
    de: 'Keine Berechtigung: Diese Seite ist nur für Administratoren.',
    en: 'Not enough rights: this page is only for administrators.',
  },
  ACCOUNT_BLOCKED: {
    ru: 'Этот аккаунт заблокирован администратором.',
    de: 'Dieses Konto wurde vom Administrator gesperrt.',
    en: 'This account has been blocked by the administrator.',
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

/**
 * Ключи только из заголовков X-User-*. Ничего не сохраняют.
 * Если у запроса есть сессия, дополнительно берутся ключи из аккаунта — см. auth/keys.ts.
 */
export function getHeaderKeys(request: Request): { gemini?: string; groq?: string } {
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
