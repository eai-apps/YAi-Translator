/**
 * Валидация ответа ИИ при разборе официального письма (Часть 17).
 */
import type { LetterExplainCore, LetterUrgency } from '../../../shared/types';

export function validateLetter(raw: unknown): LetterExplainCore | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const sender = typeof o.sender === 'string' && o.sender.trim() ? o.sender.trim() : 'Unbekannter Absender';
  const summary = typeof o.summary === 'string' && o.summary.trim() ? o.summary.trim() : '';
  if (!summary) return null;

  const deadline = typeof o.deadline === 'string' && o.deadline.trim() ? o.deadline.trim() : null;
  const hasDeadline = Boolean(o.hasDeadline || deadline);

  let urgency: LetterUrgency = 'normal';
  if (o.urgency === 'high' || o.urgency === 'low') {
    urgency = o.urgency;
  } else if (hasDeadline) {
    urgency = 'high';
  }

  const steps: string[] = Array.isArray(o.steps)
    ? o.steps.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];

  const replyTemplate = typeof o.replyTemplate === 'string' ? o.replyTemplate.trim() : '';

  return {
    sender,
    summary,
    deadline,
    hasDeadline,
    urgency,
    steps: steps.length > 0 ? steps : ['Письмо носит информационный характер.'],
    replyTemplate: replyTemplate || 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihr Schreiben...',
  };
}
