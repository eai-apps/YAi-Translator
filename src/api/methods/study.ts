/** Учёба (этап 6): синхронизация карточек, счётчики админки и слово дня. */
import type {
  StudyPingRequest,
  StudySyncRequest,
  StudySyncResponse,
  WordOfDayResponse,
} from '../../../shared/types';
import { request } from '../request';

/** Тело обмена: since — время предыдущего ответа сервера (0 — забрать всё). */
export type StudySyncPayload = StudySyncRequest & { since: number };

export const studyMethods = {
  studySync(payload: StudySyncPayload): Promise<StudySyncResponse> {
    return request<StudySyncResponse>('/api/study/sync', { method: 'POST', body: payload });
  },

  /** Один раз за сессию: счётчики «повторено / упражнений» для админки. */
  studyPing(payload: StudyPingRequest): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/study/ping', { method: 'POST', body: payload });
  },

  wordOfDay(signal?: AbortSignal): Promise<WordOfDayResponse> {
    return request<WordOfDayResponse>('/api/word-of-day', { method: 'GET' }, signal);
  },
};
