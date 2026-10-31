/** Аккаунт, свои ключи и синхронизация избранного (версия 0.6.0). Выделено из shared/types.ts. */
import type { ProviderId } from './typeTasks';

/* -------------------------------- Аккаунт -------------------------------- */

/** Провайдеры, ключи которых можно хранить в аккаунте. */
export const KEY_PROVIDERS = ['gemini', 'groq'] as const;
export type KeyProvider = (typeof KEY_PROVIDERS)[number];

export interface AccountSession {
  device: string;
  lastSeenAt: number;
  createdAt: number;
  /** true — это устройство, с которого сделан запрос. */
  current: boolean;
}

/** Сохранённый ключ: сам ключ сервер никогда не возвращает. */
export interface StoredKeyInfo {
  last4: string;
  updatedAt: number;
}

export interface AccountInfo {
  login: string;
  createdAt: number;
  sessions: AccountSession[];
  keys: Record<KeyProvider, StoredKeyInfo | null>;
  keysStorageEnabled: boolean;
  /** true — логин указан в секрете ADMIN_LOGINS; только тогда видна ссылка «Админка». */
  isAdmin: boolean;
}

/** Ответ входа и регистрации. */
export interface AuthResponse {
  account: AccountInfo;
  /** Токен для приложений со своим хранилищем; для сайта сессия уже лежит в cookie. */
  token: string;
}

export interface RegisterRequest {
  login: string;
  password: string;
  /** Название устройства для списка «Мои устройства». */
  device?: string;
}

export interface LoginRequest extends RegisterRequest {}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/** Проверка ключа через /api/key-test. */
export interface KeyCheckRequest {
  provider: KeyProvider;
  key: string;
}

/** Сохранение своего ключа в аккаунт. */
export interface SaveKeyRequest {
  key: string;
}

export interface SaveKeyResponse {
  key: StoredKeyInfo;
}

/* ------------------------- Синхронизация избранного ------------------------- */

/** Одна запись избранного или истории на сервере. */
export interface SyncItem {
  id: string;
  /** JSON-строка с данными записи (HistoryItem на клиенте). */
  payload: string;
  updatedAt: number;
  deleted: boolean;
}

export interface SyncPushRequest {
  items: SyncItem[];
}

export interface SyncResponse {
  /** Записи новее запрошенного since; при первом запросе — все. */
  items: SyncItem[];
  /** Время сервера — передайте его в следующий ?since=. */
  serverTime: number;
}

/* -------------------------------- Служебное -------------------------------- */

/** Проверка сервиса (общего ключа сайта или своего ключа). */
export interface ServiceCheck {
  ok: boolean;
  latencyMs: number;
  /** Понятная причина на языке интерфейса; null, если всё в порядке. */
  message: string | null;
}

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
  /** Результаты настоящих запросов к сервисам (только при ?check=1). */
  checks?: Partial<Record<ProviderId, ServiceCheck>>;
  /** true, если результат проверки взят из кэша D1 (был запрошен меньше 10 минут назад). */
  checksCached?: boolean;
  /** false — на сервере нет секрета KEY_ENCRYPTION_SECRET, ключи можно хранить только на устройстве. */
  keysStorageEnabled?: boolean;
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
