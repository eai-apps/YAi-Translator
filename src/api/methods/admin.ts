/** Админка: статистика, ключи сайта, настройки, пользователи, журнал, ресурсы. */
import type {
  AdminAddKeyRequest,
  AdminLogResponse,
  AdminOverview,
  AdminResourcesResponse,
  AdminSettings,
  AdminSiteKeysResponse,
  AdminUsersResponse,
  ResourceInput,
  SiteKeyInfo,
  SiteKeyProvider,
  SiteKeyTestResponse,
} from '../../../shared/types';
import { request } from '../request';

export const adminMethods = {
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

  adminUserAction(payload: { login: string; action: 'block' | 'unblock' | 'delete' }): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/admin/users', { method: 'POST', body: payload });
  },

  adminLog(signal?: AbortSignal): Promise<AdminLogResponse> {
    return request<AdminLogResponse>('/api/admin/log', { method: 'GET' }, signal);
  },

  adminResources(signal?: AbortSignal): Promise<AdminResourcesResponse> {
    return request<AdminResourcesResponse>('/api/admin/resources', { method: 'GET' }, signal);
  },

  /** Ресурсы: добавить, изменить, скрыть, показать, поменять порядок, удалить. */
  adminResourceAction(
    payload:
      | (({ action: 'add'; id?: undefined } | { action: 'update'; id: number }) & ResourceInput)
      | { action: 'hide' | 'show' | 'delete'; id: number }
      | { action: 'move'; id: number; direction: 'up' | 'down' }
      | { action: 'showInApps'; value: boolean },
  ): Promise<AdminResourcesResponse> {
    return request<AdminResourcesResponse>('/api/admin/resources', { method: 'POST', body: payload });
  },
};
