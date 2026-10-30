/** Единая точка всех запросов к бэкенду. Компоненты не вызывают fetch напрямую. */
import type {
  ApiErrorBody,
  ApiErrorCode,
  CheckRequest,
  CheckResponse,
  ExplainRequest,
  ExplainResponse,
  HealthResponse,
  KeyTestRequest,
  KeyTestResponse,
  TranslateRequest,
  TranslateResponse,
  WordRequest,
  WordResponse,
} from '../../shared/types';
import { API_BASE } from '../config';
import { getUserKeys } from '../lib/userKeys';

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

async function request<T>(
  path: string,
  init: { method: 'GET' } | { method: 'POST'; body: unknown },
  signal?: AbortSignal,
): Promise<T> {
  const keys = getUserKeys();
  const headers: Record<string, string> = {
    'X-UI-Language': uiLanguage,
    Accept: 'application/json',
  };
  if (keys.gemini) headers['X-User-Gemini-Key'] = keys.gemini;
  if (keys.groq) headers['X-User-Groq-Key'] = keys.groq;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers: init.method === 'POST' ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: init.method === 'POST' ? JSON.stringify(init.body) : undefined,
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiClientError('NETWORK', 0);
  }

  const data: unknown = await response.json().catch(() => null);

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

export const api = {
  translate(payload: TranslateRequest, signal?: AbortSignal): Promise<TranslateResponse> {
    return request<TranslateResponse>('/api/translate', { method: 'POST', body: payload }, signal);
  },

  word(payload: WordRequest, signal?: AbortSignal): Promise<WordResponse> {
    return request<WordResponse>('/api/word', { method: 'POST', body: payload }, signal);
  },

  explain(payload: ExplainRequest, signal?: AbortSignal): Promise<ExplainResponse> {
    return request<ExplainResponse>('/api/explain', { method: 'POST', body: payload }, signal);
  },

  check(payload: CheckRequest, signal?: AbortSignal): Promise<CheckResponse> {
    return request<CheckResponse>('/api/check', { method: 'POST', body: payload }, signal);
  },

  health(signal?: AbortSignal): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health', { method: 'GET' }, signal);
  },

  testKey(payload: KeyTestRequest, signal?: AbortSignal): Promise<KeyTestResponse> {
    return request<KeyTestResponse>('/api/key-test', { method: 'POST', body: payload }, signal);
  },
};
