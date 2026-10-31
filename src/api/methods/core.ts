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
  WordRequest,
  WordResponse,
} from '../../../shared/types';
import { request } from '../request';

export const coreMethods = {
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
};
