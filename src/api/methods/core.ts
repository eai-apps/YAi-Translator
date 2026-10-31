/** Перевод, карточки слова, словари, ресурсы, состояние сервисов (без входа). */
import type {
  CheckRequest,
  CheckResponse,
  CompareRequest,
  CompareResponse,
  DictRequest,
  DictResponse,
  ExplainRequest,
  ExplainResponse,
  HealthResponse,
  KeyTestRequest,
  KeyTestResponse,
  LanguageCode,
  ResourcesResponse,
  SiteSettingsResponse,
  SuggestResponse,
  TranslateRequest,
  TranslateResponse,
  WordAskRequest,
  AskResponse,
  WordRequest,
  WordResponse,
  BuyLinkItem,
} from '../../../shared/types';
import { request } from '../request';

export const coreMethods = {
  transcribe(blob: Blob, lang?: string, signal?: AbortSignal): Promise<{ text: string }> {
    const params = lang && lang !== 'auto' ? `?lang=${encodeURIComponent(lang)}` : '';
    return request<{ text: string }>(`/api/transcribe${params}`, { method: 'POST', body: blob }, signal);
  },

  wordAsk(payload: WordAskRequest, signal?: AbortSignal): Promise<AskResponse> {
    return request<AskResponse>('/api/word-ask', { method: 'POST', body: payload }, signal);
  },

  translate(payload: TranslateRequest, signal?: AbortSignal): Promise<TranslateResponse> {
    return request<TranslateResponse>('/api/translate', { method: 'POST', body: payload }, signal);
  },

  word(payload: WordRequest, signal?: AbortSignal): Promise<WordResponse> {
    return request<WordResponse>('/api/word', { method: 'POST', body: payload }, signal);
  },

  /** Карточка слова из настоящих словарей (без ИИ и без ключей). */
  dict(payload: DictRequest, signal?: AbortSignal): Promise<DictResponse> {
    return request<DictResponse>('/api/dict', { method: 'POST', body: payload }, signal);
  },

  /** Полезные ресурсы по языкам (без входа и без ключей). */
  resources(signal?: AbortSignal): Promise<ResourcesResponse> {
    return request<ResourcesResponse>('/api/resources', { method: 'GET' }, signal);
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

  /** Нейросети сайта (без ключей) для списка режимов перевода. */
  aiModels(signal?: AbortSignal): Promise<{
    models: Array<{ id: string; model: string; ok?: boolean | null }>;
    regOnly: boolean;
    defaultId?: string | null;
  }> {
    return request('/api/ai-models', { method: 'GET' }, signal);
  },

  /** Настоящая проверка всех настроенных сервисов сайта (кэшируется на сервере 10 минут). */
  healthCheck(signal?: AbortSignal): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health?check=1', { method: 'GET' }, signal);
  },

  testKey(payload: KeyTestRequest, signal?: AbortSignal): Promise<KeyTestResponse> {
    return request<KeyTestResponse>('/api/key-test', { method: 'POST', body: payload }, signal);
  },

  /** Баннер-объявление и дневной лимит — для всех посетителей. */
  siteSettings(signal?: AbortSignal): Promise<SiteSettingsResponse> {
    return request<SiteSettingsResponse>('/api/site-settings', { method: 'GET' }, signal);
  },

  /** Подсказки при наборе одного слова (Wiktionary, кэш на сервере 30 дней). */
  suggest(query: string, lang: LanguageCode, signal?: AbortSignal): Promise<SuggestResponse> {
    const params = new URLSearchParams({ q: query, lang });
    return request<SuggestResponse>(`/api/suggest?${params.toString()}`, { method: 'GET' }, signal);
  },

  /** Сколько слов уже в кэше подсказок — для кнопки «Проверить офлайн-готовность». */
  suggestCount(signal?: AbortSignal): Promise<SuggestResponse> {
    return request<SuggestResponse>('/api/suggest?count=1', { method: 'GET' }, signal);
  },

  /** Активные ссылки «Где купить ключ» (этап 7). */
  publicBuyLinks(signal?: AbortSignal): Promise<{ items: BuyLinkItem[] }> {
    return request<{ items: BuyLinkItem[] }>('/api/buy-links', { method: 'GET' }, signal);
  },

  /** Загрузка моделей для платного ключа пользователя (этап 7). */
  fetchPaidModels(
    baseUrl: string,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<{ models: Array<{ id: string; priceIn?: number; slow: boolean }> }> {
    return request('/api/paid-models', { method: 'POST', body: { baseUrl, apiKey } }, signal);
  },

  /** Проверка одной платной модели пользователя (этап 7). */
  testPaidModel(
    baseUrl: string,
    apiKey: string,
    model: string,
    signal?: AbortSignal,
  ): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    return request('/api/paid-test', { method: 'POST', body: { baseUrl, apiKey, model } }, signal);
  },
};
