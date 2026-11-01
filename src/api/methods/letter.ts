/**
 * Метод API для разбора официальных писем (Часть 17).
 */
import type { LetterExplainRequest, LetterExplainResponse } from '../../../shared/types';
import { request } from '../request';

export const letterMethods = {
  explainLetter(payload: LetterExplainRequest, signal?: AbortSignal): Promise<LetterExplainResponse> {
    return request<LetterExplainResponse>('/api/letter', { method: 'POST', body: payload }, signal);
  },
};
