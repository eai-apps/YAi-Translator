/** Единая точка всех запросов к бэкенду. Компоненты не вызывают fetch напрямую. */
import type {
  AccountInfo,
  AdminAddKeyRequest,
  AdminLogResponse,
  AdminOverview,
  AdminSettings,
  AdminSiteKeysResponse,
  AdminUsersResponse,
  ApiErrorBody,
  ApiErrorCode,
  AuthResponse,
  ChangePasswordRequest,
  CheckRequest,
  CheckResponse,
  CompareRequest,
  CompareResponse,
  ExplainRequest,
  ExplainResponse,
  HealthResponse,
  KeyProvider,
  KeyTestRequest,
  KeyTestResponse,
  LoginRequest,
  RegisterRequest,
  SaveKeyRequest,
  SaveKeyResponse,
  SiteKeyInfo,
  SiteKeyProvider,
  SiteKeyTestResponse,
  SiteSettingsResponse,
  SyncPushRequest,
  SyncResponse,
  TranslateRequest,
  TranslateResponse,
  WordRequest,
  WordResponse,
} from '../../shared/types';
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

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestInit_ {
  method: Method;
  body?: unknown;
  /** false — не отправлять токен и X-User-ключи (например, при входе). */
  withAuth?: boolean;
}

async function request<T>(path: string, init: RequestInit_, signal?: AbortSignal): Promise<T> {
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // Cookie сессии отправляется и на другой домен (Capacitor); сервер разрешает это в CORS.
      credentials: withAuth ? 'include' : 'same-origin',
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

  compare(payload: CompareRequest, signal?: AbortSignal): Promise<CompareResponse> {
    return request<CompareResponse>('/api/compare', { method: 'POST', body: payload }, signal);
  },

  health(signal?: AbortSignal): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health', { method: 'GET' }, signal);
  },

  /** Настоящая проверка всех настроенных сервисов сайта (кэшируется на сервере 10 минут). */
  healthCheck(signal?: AbortSignal): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health?check=1', { method: 'GET' }, signal);
  },

  testKey(payload: KeyTestRequest, signal?: AbortSignal): Promise<KeyTestResponse> {
    return request<KeyTestResponse>('/api/key-test', { method: 'POST', body: payload }, signal);
  },

  /* ------------------------------- Аккаунт ------------------------------- */

  register(payload: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
      withAuth: true,
    });
  },

  login(payload: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
      withAuth: false,
    });
  },

  logout(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  logoutAll(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/auth/logout-all', { method: 'POST' });
  },

  me(signal?: AbortSignal): Promise<AccountInfo> {
    return request<AccountInfo>('/api/auth/me', { method: 'GET' }, signal);
  },

  changePassword(payload: ChangePasswordRequest): Promise<AccountInfo> {
    return request<AccountInfo>('/api/auth/password', { method: 'POST', body: payload });
  },

  /* -------------------------------- Ключи -------------------------------- */

  saveAccountKey(provider: KeyProvider, payload: SaveKeyRequest): Promise<SaveKeyResponse> {
    return request<SaveKeyResponse>(`/api/keys/${provider}`, { method: 'PUT', body: payload });
  },

  deleteAccountKey(provider: KeyProvider): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/keys/${provider}`, { method: 'DELETE' });
  },

  testAccountKey(provider: KeyProvider): Promise<KeyTestResponse> {
    return request<KeyTestResponse>(`/api/keys/${provider}/test`, { method: 'POST', body: {} });
  },

  /* ---------------------------- Синхронизация ---------------------------- */

  syncPull(since: number, signal?: AbortSignal): Promise<SyncResponse> {
    return request<SyncResponse>(`/api/sync?since=${Math.max(0, Math.floor(since))}`, { method: 'GET' }, signal);
  },

  syncPush(payload: SyncPushRequest): Promise<SyncResponse> {
    return request<SyncResponse>('/api/sync', { method: 'PUT', body: payload });
  },

  /* -------------------------- Настройки сайта --------------------------- */

  /** Баннер-объявление и дневной лимит — для всех посетителей. */
  siteSettings(signal?: AbortSignal): Promise<SiteSettingsResponse> {
    return request<SiteSettingsResponse>('/api/site-settings', { method: 'GET' }, signal);
  },

  /* -------------------------------- Админка ------------------------------- */

  adminOverview(signal?: AbortSignal): Promise<AdminOverview> {
    return request<AdminOverview>('/api/admin/overview', { method: 'GET' }, signal);
  },

  adminKeys(signal?: AbortSignal): Promise<AdminSiteKeysResponse> {
    return request<AdminSiteKeysResponse>('/api/admin/keys', { method: 'GET' }, signal);
  },

  adminAddKey(payload: AdminAddKeyRequest): Promise<{ key: SiteKeyInfo }> {
    return request('/api/admin/keys', { method: 'POST', body: payload });
  },

  adminTestKey(provider: SiteKeyProvider): Promise<SiteKeyTestResponse> {
    return request<SiteKeyTestResponse>(`/api/admin/keys/${provider}/test`, { method: 'POST', body: {} });
  },

  adminRemoveKey(provider: SiteKeyProvider, id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/admin/keys/${provider}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  adminSettings(signal?: AbortSignal): Promise<AdminSettings> {
    return request<AdminSettings>('/api/admin/settings', { method: 'GET' }, signal);
  },

  adminSaveSettings(payload: {
    dailyLimit?: number | null;
    banner?: AdminSettings['banner'];
    disabledProviders?: string[];
  }): Promise<AdminSettings> {
    return request<AdminSettings>('/api/admin/settings', { method: 'PUT', body: payload });
  },

  adminUsers(signal?: AbortSignal): Promise<AdminUsersResponse> {
    return request<AdminUsersResponse>('/api/admin/users', { method: 'GET' }, signal);
  },

  adminUserAction(payload: {
    login: string;
    action: 'block' | 'unblock' | 'delete';
  }): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/admin/users', { method: 'POST', body: payload });
  },

  adminLog(signal?: AbortSignal): Promise<AdminLogResponse> {
    return request<AdminLogResponse>('/api/admin/log', { method: 'GET' }, signal);
  },
};
