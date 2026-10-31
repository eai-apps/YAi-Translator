/** Справочник грамматики и «Спросить у AI» (этап 5). */
import type {
  AskRequest,
  AskResponse,
  GrammarTopicResponse,
  GrammarTopicsResponse,
} from '../../../shared/types';
import { request } from '../request';

export const grammarMethods = {
  /** Список тем справочника — без текста, грузится быстро. */
  grammarTopics(signal?: AbortSignal): Promise<GrammarTopicsResponse> {
    return request<GrammarTopicsResponse>('/api/grammar/topics', { method: 'GET' }, signal);
  },

  /**
   * Тема справочника. При первом открытии сервер сам просит ИИ и сохраняет текст навсегда;
   * если ИИ сейчас недоступен, приходит тема без body и с offlineReason.
   */
  grammarTopic(slug: string, uiLang: string, signal?: AbortSignal): Promise<GrammarTopicResponse> {
    return request<GrammarTopicResponse>(
      `/api/grammar/topic?slug=${encodeURIComponent(slug)}&ui=${encodeURIComponent(uiLang)}`,
      { method: 'GET' },
      signal,
    );
  },

  /** «Спросить у AI»: ответ учителя кэшируется на сервере на 90 дней. */
  ask(payload: AskRequest, signal?: AbortSignal): Promise<AskResponse> {
    return request<AskResponse>('/api/ask', { method: 'POST', body: payload }, signal);
  },
};
