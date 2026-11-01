/** Админка: статистика, ключи сайта, настройки, пользователи, журнал, ресурсы, грамматика. */
import type {
  AdminAddKeyRequest,
  AdminGrammarAction,
  AdminGrammarResponse,
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
  BuyLinkItem,
  PaidConnectionItem,
  WordCard,
  AdminErrorsResponse,
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
    feedbackEmail?: string;
    myMemoryEmail?: string;
    guestAiLimit?: number;
    registeredAiLimit?: number;
    aiRequiresLogin?: boolean;
    wordCardAuto?: boolean;
    whatsNew?: AdminSettings['whatsNew'];
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

  /** Справочник грамматики: все темы с текстом и статусом. */
  adminGrammar(signal?: AbortSignal): Promise<AdminGrammarResponse> {
    return request<AdminGrammarResponse>('/api/admin/grammar', { method: 'GET' }, signal);
  },

  /** Грамматика: добавить, изменить, перегенерировать ИИ или удалить тему. */
  adminGrammarAction(payload: AdminGrammarAction): Promise<AdminGrammarResponse> {
    return request<AdminGrammarResponse>('/api/admin/grammar', { method: 'POST', body: payload });
  },

  adminPaidConnections(signal?: AbortSignal): Promise<{
    connections: PaidConnectionItem[];
    order: 'free_first' | 'paid_first' | 'paid_off';
    regOnly: boolean;
    dailyLimit: number;
    monthlyLimit: number;
  }> {
    return request('/api/admin/paid-connections', { method: 'GET' }, signal);
  },

  adminPaidAction<T = unknown>(payload: Record<string, unknown>): Promise<T> {
    return request<T>('/api/admin/paid-connections', { method: 'POST', body: payload });
  },

  adminBuyLinks(signal?: AbortSignal): Promise<{ items: BuyLinkItem[] }> {
    return request('/api/admin/buy-links', { method: 'GET' }, signal);
  },

  adminBuyLinkAction(payload: Record<string, unknown>): Promise<{ ok: boolean }> {
    return request('/api/admin/buy-links', { method: 'POST', body: payload });
  },

  adminWarmBatch(batchSize: number = 40): Promise<{
    ok: boolean;
    cursor: number;
    total: number;
    processed: number;
    warmed: number;
    skipped: number;
    errors: number;
  }> {
    return request('/api/admin/warm', { method: 'POST', body: { batchSize } });
  },

  adminRecreateCard(payload: {
    word: string;
    lang: string;
    explainLang: string;
  }): Promise<{ ok: boolean; card: WordCard }> {
    return request('/api/admin/recreate-card', { method: 'POST', body: payload });
  },

  adminErrors(signal?: AbortSignal): Promise<AdminErrorsResponse> {
    return request<AdminErrorsResponse>('/api/admin/errors', { method: 'GET' }, signal);
  },

  adminClearErrors(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/admin/errors', { method: 'DELETE' });
  },
};
