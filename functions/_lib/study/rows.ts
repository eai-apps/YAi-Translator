/** Строки таблиц учёбы и преобразование их в ответ API (этап 6). */
import type { PartOfSpeech, StudyArticle, StudyCard, StudyDay, StudyProgress } from '../../../shared/types';

export interface CardRow {
  card_id: string;
  payload: string;
  updated_at: number;
}

export interface ProgressRow {
  card_id: string;
  ease: number;
  interval: number;
  due: number;
  reps: number;
  lapses: number;
  introduced_at: number;
  updated_at: number;
}

export interface DayRow {
  day: string;
  reviews: number;
  exercises: number;
  updated_at: number;
}

/** «?» через запятую — для IN (…). */
export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

/** Сколько id можно перечислить в одном IN (…): D1 позволяет не больше 100 параметров в запросе. */
export const ID_CHUNK = 90;

/** Снимок карточки лежит в payload; id и updated_at свежие из самой строки. */
export function toCard(row: CardRow): StudyCard | null {
  try {
    const card = JSON.parse(row.payload) as StudyCard;
    if (!card || typeof card.lemma !== 'string' || !Array.isArray(card.translations)) return null;
    const lang = card.lang ?? (row.card_id.startsWith('en:') ? 'en' : 'de');
    return {
      ...card,
      id: row.card_id,
      lang,
      deckId: card.deckId ?? null,
      article: (card.article ?? null) as StudyArticle | null,
      partOfSpeech: card.partOfSpeech as PartOfSpeech,
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}

export function toProgress(row: ProgressRow): StudyProgress {
  return {
    cardId: row.card_id,
    ease: row.ease,
    interval: row.interval,
    due: row.due,
    reps: row.reps,
    lapses: row.lapses,
    introducedAt: row.introduced_at,
    updatedAt: row.updated_at,
  };
}

export function toDay(row: DayRow): StudyDay {
  return { day: row.day, reviews: row.reviews, exercises: row.exercises, updatedAt: row.updated_at };
}
