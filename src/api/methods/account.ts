/** Аккаунт, свои ключи, синхронизация избранного и истории. */
import type {
  AccountInfo,
  AuthResponse,
  ChangePasswordRequest,
  KeyProvider,
  KeyTestResponse,
  LoginRequest,
  RegisterRequest,
  SaveKeyRequest,
  SaveKeyResponse,
  SyncPushRequest,
  SyncResponse,
} from '../../../shared/types';
import { request } from '../request';

export const accountMethods = {
  register(payload: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', { method: 'POST', body: payload, withAuth: true });
  },

  login(payload: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', { method: 'POST', body: payload, withAuth: false });
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

  deleteAccount(password: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/auth/delete', { method: 'POST', body: { password } });
  },

  saveAccountKey(provider: KeyProvider, payload: SaveKeyRequest): Promise<SaveKeyResponse> {
    return request<SaveKeyResponse>(`/api/keys/${provider}`, { method: 'PUT', body: payload });
  },

  deleteAccountKey(provider: KeyProvider): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/keys/${provider}`, { method: 'DELETE' });
  },

  testAccountKey(provider: KeyProvider): Promise<KeyTestResponse> {
    return request<KeyTestResponse>(`/api/keys/${provider}/test`, { method: 'POST', body: {} });
  },

  syncPull(since: number, signal?: AbortSignal): Promise<SyncResponse> {
    return request<SyncResponse>(`/api/sync?since=${Math.max(0, Math.floor(since))}`, { method: 'GET' }, signal);
  },

  syncPush(payload: SyncPushRequest): Promise<SyncResponse> {
    return request<SyncResponse>('/api/sync', { method: 'PUT', body: payload });
  },
};
