/**
 * Проверка данных учёбы перед записью в D1 (этап 6).
 * Всё, что приходит с устройства, проверяется по типам и границам:
 * битый запрос отклоняется целиком, а не портит прогресс пользователя.
 */
import type {
  PartOfSpeech,
  StudyArticle,
  StudyCard,
  StudyDay,
  StudyProgress,
  StudySyncRequest,
} from '../../../shared/types';
import { STUDY_MAX_CARDS } from '../../../shared/study';
import { STUDY } from '../config';
import { ApiError } from '../http';

const ARTICLES: Array<StudyArticle | null> = ['der', 'die', 'das', null];
const PARTS: PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'numeral',
  'interjection',
  'phrase',
  'other',
];

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') throw new ApiError('VALIDATION', 400);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new ApiError('VALIDATION', 400);
  return trimmed;
}

function optionalText(value: unknown, max: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  return text(value, max);
}

function finite(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new ApiError('VALIDATION', 400);
  if (value < min || value > max) throw new ApiError('VALIDATION', 400);
  return Math.round(value);
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new ApiError('VALIDATION', 400);
  if (value.length > STUDY.maxItemsPerRequest) throw new ApiError('VALIDATION', 400);
  return value;
}

function parseCard(raw: unknown): StudyCard {
  const card = raw as Partial<StudyCard> | null;
  if (!card || typeof card !== 'object') throw new ApiError('VALIDATION', 400);

  const id = text(card.id, 140);
  const lemma = text(card.lemma, 80);
  // id строится на клиенте как «de:слово» — принимаем только такой формат.
  if (id !== `de:${lemma.toLowerCase()}`) throw new ApiError('VALIDATION', 400);
  if (!ARTICLES.includes(card.article === undefined ? null : card.article)) {
    throw new ApiError('VALIDATION', 400);
  }
  if (!PARTS.includes(card.partOfSpeech as PartOfSpeech)) throw new ApiError('VALIDATION', 400);

  const translations = Array.isArray(card.translations) ? card.translations : [];
  if (translations.length === 0 || translations.length > 3) throw new ApiError('VALIDATION', 400);

  let example: StudyCard['example'] = null;
  if (card.example) {
    example = {
      text: text(card.example.text, 400),
      translation: text(card.example.translation, 400),
    };
  }

  return {
    id,
    lemma,
    lang: 'de',
    article: (card.article ?? null) as StudyArticle | null,
    plural: optionalText(card.plural, 80),
    partOfSpeech: card.partOfSpeech as PartOfSpeech,
    translations: translations.map((item) => text(item, 120)),
    example,
    perfekt: optionalText(card.perfekt, 120),
    addedAt: finite(card.addedAt, 0, 8_640_000_000_000_000),
    updatedAt: finite(card.updatedAt, 0, 8_640_000_000_000_000),
  };
}

function parseProgress(raw: unknown): StudyProgress {
  const item = raw as Partial<StudyProgress> | null;
  if (!item || typeof item !== 'object') throw new ApiError('VALIDATION', 400);
  return {
    cardId: text(item.cardId, 140),
    // ease — дробное число, поэтому проверяем отдельно, без округления.
    ease: (() => {
      if (typeof item.ease !== 'number' || !Number.isFinite(item.ease)) throw new ApiError('VALIDATION', 400);
      return Math.min(3.5, Math.max(1.3, item.ease));
    })(),
    interval: finite(item.interval, 0, 100_000),
    due: finite(item.due, 0, 8_640_000_000_000_000),
    reps: finite(item.reps, 0, 1_000_000),
    lapses: finite(item.lapses, 0, 1_000_000),
    introducedAt: finite(item.introducedAt, 0, 8_640_000_000_000_000),
    updatedAt: finite(item.updatedAt, 0, 8_640_000_000_000_000),
  };
}

/** День по местному времени: ГГГГ-ММ-ДД. */
function parseDay(raw: unknown): StudyDay {
  const item = raw as Partial<StudyDay> | null;
  if (!item || typeof item !== 'object') throw new ApiError('VALIDATION', 400);
  if (typeof item.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.day)) {
    throw new ApiError('VALIDATION', 400);
  }
  return {
    day: item.day,
    reviews: finite(item.reviews, 0, 100_000),
    exercises: finite(item.exercises, 0, 100_000),
    updatedAt: finite(item.updatedAt, 0, 8_640_000_000_000_000),
  };
}

/** Разбирает тело POST /api/study/sync. Пустые списки допустимы. */
export function parseSyncRequest(body: Record<string, unknown>): Required<StudySyncRequest> & { since: number } {
  const sinceRaw = body.since;
  const since = typeof sinceRaw === 'number' && Number.isFinite(sinceRaw) && sinceRaw >= 0 ? Math.floor(sinceRaw) : 0;

  const cards = body.cards === undefined ? [] : list(body.cards).map(parseCard);
  const progress = body.progress === undefined ? [] : list(body.progress).map(parseProgress);
  const days = body.days === undefined ? [] : list(body.days).map(parseDay);

  if (cards.length > STUDY_MAX_CARDS) throw new ApiError('VALIDATION', 400);
  return { since, cards, progress, days };
}

/** Тело POST /api/study/ping: счётчики за сессию. */
export function parsePingRequest(body: Record<string, unknown>): { reviews: number; exercises: number } {
  const pick = (value: unknown, max: number): number => {
    if (value === undefined) return 0;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new ApiError('VALIDATION', 400);
    return Math.min(max, Math.floor(value));
  };
  const reviews = pick(body.reviews, STUDY.maxPingReviews);
  const exercises = pick(body.exercises, STUDY.maxPingExercises);
  return { reviews, exercises };
}
