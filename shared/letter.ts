/**
 * Типы для сервиса «Объясни письмо из Behörde» (Часть 17).
 */
import type { UiLanguage } from './languages';
import type { ProviderId } from './typeTasks';

export interface LetterExplainRequest {
  text: string;
  uiLang?: UiLanguage;
  aiModel?: string;
}

export type LetterUrgency = 'high' | 'normal' | 'low';

export interface LetterExplainCore {
  sender: string;
  summary: string;
  deadline: string | null;
  hasDeadline: boolean;
  urgency: LetterUrgency;
  steps: string[];
  replyTemplate: string;
}

export interface LetterExplainResponse extends LetterExplainCore {
  provider: ProviderId;
  model?: string;
}
