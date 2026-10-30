/**
 * Общая часть запросов к бэкенду: заголовки, ошибки, CORS-cookie и адрес API.
 * Все методы API собраны в api/client.ts; здесь только механизм.
 */
import type { ApiErrorBody, ApiErrorCode } from '../../shared/types';
import { API_BASE } from '../config';
import { getUserKeys } from '../lib/userKeys';
import { getSessionToken } from '../lib/sessionToken';

/** Сетевая ошибка добавляется к кодам сервера. */
export type ClientErrorCode = ApiErrorCode | 'NETWORK';

export class ApiClientError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(code: ClientErrorCode, status: number, message?: string, retryAfterSeconds?: number) {
    super(message ?? '');
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

let uiLanguage: string = 'ru';

/** Клиент сообщает серверу язык интерфейса (для текстов ошибок). */
export function setApiUiLanguage(language: string): void {
  uiLanguage = language;
}

/** Сколько ждать ответа сервера, прежде чем показать ошибку и кнопку «Повторить». */
const REQUEST_TIMEOUT_MS = 30_000;

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestInit_ {
  method: Method;
  body?: unknown;
  /** false — не отправлять токен и X-User-ключи (например, при входе). */
  withAuth?: boolean;
}

/** Один запрос к API: заголовки, cookie, JSON и понятная ошибка. */
export async function request<T>(path: string, init: RequestInit_, signal?: AbortSignal): Promise<T> {
  const withAuth = init.withAuth ?? true;
  const headers: Record<string, string> = {
    'X-UI-Language': uiLanguage,
    Accept: 'application/json',
  };

  if (withAuth) {
    // Ключи с устройства важнее ключей аккаунта — сервер сам решает этот порядок.
    const keys = getUserKeys();
    if (keys.gemini) headers['X-User-Gemini-Key'] = keys.gemini;
    if (keys.groq) headers['X-User-Groq-Key'] = keys.groq;
    // На сайте сессия в cookie; токен нужен приложениям, где cookie недоступна.
    const token = getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  // Защита от «вечного» спиннера: если сервер или сеть молчат 30 с, запрос прерывается с понятной ошибкой.
  const timeout = new AbortController();
  const onOuterAbort = () => timeout.abort();
  signal?.addEventListener('abort', onOuterAbort, { once: true });
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // Cookie сессии отправляется и на другой домен (Capacitor); сервер разрешает это в CORS.
      credentials: withAuth ? 'include' : 'same-origin',
      signal: timeout.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
    if (signal?.aborted) throw error;
    throw new ApiClientError('NETWORK', 0);
  }

  const data: unknown = await response.json().catch(() => null);
  clearTimeout(timer);
  signal?.removeEventListener('abort', onOuterAbort);

  if (!response.ok) {
    const serverError = (data as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      serverError?.code ?? 'INTERNAL',
      response.status,
      serverError?.message,
      serverError?.retryAfterSeconds,
    );
  }

  return data as T;
}
