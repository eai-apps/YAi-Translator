/**
 * Учёба (версия 0.7.0): карточки слов, интервальное повторение, готовые наборы
 * и слово дня. Общие типы для сайта и Functions — подключаются через shared/types.ts.
 */
import type { PartOfSpeech } from './typeTasks';

/** Артикль с цветом: der — синий, die — красный, das — зелёный. */
export type StudyArticle = 'der' | 'die' | 'das';

/** Оценка после показа карточки. */
export type StudyGrade = 'again' | 'hard' | 'good' | 'easy';

/** Виды упражнений. */
export type PracticeType = 'article' | 'plural' | 'translation' | 'listening' | 'sentence';

export const PRACTICE_TYPES: PracticeType[] = [
  'article',
  'plural',
  'translation',
  'listening',
  'sentence',
];

export function isPracticeType(value: unknown): value is PracticeType {
  return typeof value === 'string' && (PRACTICE_TYPES as string[]).includes(value);
}

/* -------------------------------- Карточки -------------------------------- */

/** Простой пример с переводом на русский (из карточки слова или набора). */
export interface StudyExample {
  text: string;
  translation: string;
}

/** Снимок слова без служебных полей: из него собирается карточка. */
export interface StudyCardInput {
  lemma: string;
  article: StudyArticle | null;
  plural: string | null;
  partOfSpeech: PartOfSpeech;
  /** До трёх переводов на языке перевода. */
  translations: string[];
  example: StudyExample | null;
  /** Для глаголов готовая форма Perfekt, например «hat gearbeitet». */
  perfekt: string | null;
}

/** Карточка слова — снимок на момент добавления, без запросов к ИИ. */
export interface StudyCard extends StudyCardInput {
  id: string;
  lang: 'de';
  addedAt: number;
  updatedAt: number;
}

/* ------------------------------- Повторение ------------------------------- */

/** Прогресс карточки по упрощённому SM-2. Хранится локально и в аккаунте. */
export interface StudyProgress {
  cardId: string;
  /** Множитель лёгкости (1.3 … 3.0). */
  ease: number;
  /** Текущий интервал в днях (0 — карточку надо повторить сегодня). */
  interval: number;
  /** Когда карточку снова показывать (мс). */
  due: number;
  reps: number;
  lapses: number;
  /** Когда карточка впервые показана: нужно для лимита новых в день. */
  introducedAt: number;
  updatedAt: number;
}

/* -------------------------------- Дни учёбы ------------------------------- */

/** Итоги одного дня: сколько карточек повторено и сколько упражнений сделано. */
export interface StudyDay {
  /** День по местному времени, ГГГГ-ММ-ДД. */
  day: string;
  reviews: number;
  exercises: number;
  updatedAt: number;
}

/* ------------------------- Синхронизация с аккаунтом ------------------------ */

export interface StudySyncRequest {
  cards?: StudyCard[];
  progress?: StudyProgress[];
  days?: StudyDay[];
}

export interface StudySyncResponse {
  cards: StudyCard[];
  progress: StudyProgress[];
  days: StudyDay[];
  /** Время сервера — передайте его в следующий ?since=. */
  serverTime: number;
  /** Карточки, которые не поместились в лимит аккаунта и удалены сервером. */
  removed: string[];
}

/** Счётчики для админки; отправляются один раз за сессию, а не на каждую карточку. */
export interface StudyPingRequest {
  reviews?: number;
  exercises?: number;
}

/* ------------------------------- Готовые наборы ---------------------------- */

/** Перевод слова для готовых наборов: русский, украинский, английский и язык интерфейса. */
export interface DeckTranslations {
  ru: string;
  uk: string;
  en: string;
}

/** Слово из готового набора: переводы сразу на языках набора. */
export interface DeckWord {
  lemma: string;
  article: StudyArticle | null;
  plural: string | null;
  partOfSpeech: PartOfSpeech;
  translations: DeckTranslations;
  example: StudyExample;
}

export interface StudyDeck {
  id: string;
  level: 'A1' | 'A2';
  /** Ключ названия в файлах локализации. */
  titleKey: string;
  words: DeckWord[];
}

/** Ответ GET /api/word-of-day — одно слово на всех до конца дня по UTC. */
export interface WordOfDayResponse {
  /** День по UTC, ГГГГ-ММ-ДД. */
  date: string;
  deckId: string;
  deckTitleKey: string;
  word: DeckWord;
}

/* -------------------------------- Настройки -------------------------------- */

/** Больше карточек на аккаунт сервер не принимает. */
export const STUDY_MAX_CARDS = 3000;
/** Карточек в одной сессии повторения. */
export const STUDY_SESSION_MAX = 20;
/** Новых карточек в день по умолчанию (настройка). */
export const STUDY_NEW_PER_DAY_DEFAULT = 10;
/** Варианты цели дня в карточках. */
export const STUDY_GOALS = [10, 20, 30] as const;
/** День засчитан, если повторено столько карточек или сделано одно упражнение. */
export const STUDY_STREAK_REVIEWS = 10;

/** Постоянный id карточки: одно слово — одна карточка на всех устройствах. */
export function studyCardId(lemma: string): string {
  return `de:${lemma.trim().toLowerCase()}`;
}

/** Название дня по UTC: 2026-10-31. */
export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Простой детерминированный хеш (FNV-1a): одинаковый день — одинаковое слово. */
export function hashCode(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Перевод слова из набора на языке интерфейса; для остальных языков — русский. */
export function deckTranslation(word: DeckWord, language: string): string {
  if (language === 'de' || language === 'en') return word.translations.en;
  if (language === 'uk') return word.translations.uk;
  return word.translations.ru;
}
