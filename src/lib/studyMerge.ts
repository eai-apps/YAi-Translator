/**
 * Слияние локальных данных учёбы с сервером (этап 6).
 * Побеждает запись с большим updatedAt; дни объединяются по максимуму счётчиков,
 * чтобы два устройства не удваивали числа и не затирали друг друга.
 */
import type { StudyCard, StudyDay, StudyProgress, StudySyncResponse } from '../../shared/study';

export interface StudyState {
  cards: StudyCard[];
  progress: StudyProgress[];
  days: StudyDay[];
}

export const EMPTY_STUDY_STATE: StudyState = { cards: [], progress: [], days: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isCard(value: unknown): value is StudyCard {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.lemma === 'string' &&
    Array.isArray(value.translations) &&
    value.translations.every((item) => typeof item === 'string') &&
    typeof value.updatedAt === 'number'
  );
}

function isProgress(value: unknown): value is StudyProgress {
  if (!isRecord(value)) return false;
  return (
    typeof value.cardId === 'string' &&
    typeof value.ease === 'number' &&
    typeof value.interval === 'number' &&
    typeof value.due === 'number' &&
    typeof value.updatedAt === 'number'
  );
}

function isDay(value: unknown): value is StudyDay {
  if (!isRecord(value)) return false;
  return (
    typeof value.day === 'string' &&
    typeof value.reviews === 'number' &&
    typeof value.exercises === 'number' &&
    typeof value.updatedAt === 'number'
  );
}

/** Фильтрует битые записи из localStorage: старый формат не должен ломать экран. */
export function sanitizeState(raw: Partial<StudyState>): StudyState {
  return {
    cards: Array.isArray(raw.cards) ? raw.cards.filter(isCard) : [],
    progress: Array.isArray(raw.progress) ? raw.progress.filter(isProgress) : [],
    days: Array.isArray(raw.days) ? raw.days.filter(isDay) : [],
  };
}

export interface MergeInput
  extends Partial<Pick<StudySyncResponse, 'cards' | 'progress' | 'days' | 'removed' | 'lists' | 'removedLists'>> {}

/**
 * Возвращает новое состояние или null, если менять нечего.
 * null важен: без него синхронизация вызывала бы себя бесконечно.
 */
export function mergeStudyState(state: StudyState, incoming: MergeInput): StudyState | null {
  const removed = new Set(incoming.removed ?? []);
  let changed = false;

  const cards = new Map(state.cards.map((card) => [card.id, card] as const));
  for (const id of removed) {
    if (cards.delete(id)) changed = true;
  }
  for (const card of incoming.cards ?? []) {
    if (removed.has(card.id)) continue;
    const local = cards.get(card.id);
    if (!local || card.updatedAt > local.updatedAt) {
      cards.set(card.id, card);
      changed = true;
    }
  }

  const progress = new Map(state.progress.map((item) => [item.cardId, item] as const));
  for (const id of removed) {
    if (progress.delete(id)) changed = true;
  }
  for (const item of incoming.progress ?? []) {
    if (removed.has(item.cardId) || !cards.has(item.cardId)) continue;
    const local = progress.get(item.cardId);
    if (!local || item.updatedAt > local.updatedAt) {
      progress.set(item.cardId, item);
      changed = true;
    }
  }

  const days = new Map(state.days.map((item) => [item.day, item] as const));
  for (const item of incoming.days ?? []) {
    const local = days.get(item.day);
    if (!local) {
      days.set(item.day, item);
      changed = true;
      continue;
    }
    const reviews = Math.max(local.reviews, item.reviews);
    const exercises = Math.max(local.exercises, item.exercises);
    if (reviews !== local.reviews || exercises !== local.exercises) {
      days.set(item.day, { ...local, reviews, exercises, updatedAt: Math.max(local.updatedAt, item.updatedAt) });
      changed = true;
    }
  }

  if (!changed) return null;
  return {
    cards: Array.from(cards.values()),
    progress: Array.from(progress.values()),
    days: Array.from(days.values()),
  };
}
