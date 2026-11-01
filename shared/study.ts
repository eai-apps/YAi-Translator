/**
 * Учёба (версия 0.7.0): карточки слов, интервальное повторение, готовые наборы
 * и слово дня. Общие типы для сайта и Functions — подключаются через shared/types.ts.
 */
import type { PartOfSpeech } from './typeTasks';
import type { LanguageCode } from './languages';

/** Артикль с цветом: der — синий, die — красный, das — зелёный. */
export type StudyArticle = 'der' | 'die' | 'das';

/** Оценка после показа карточки. */
export type StudyGrade = 'again' | 'hard' | 'good' | 'easy';

/** Виды упражнений (этап 6, часть 16: тренировки для любого языка). */
export type PracticeType = 'translation' | 'write' | 'listening' | 'article' | 'sentence' | 'pairs' | 'plural';

export const PRACTICE_TYPES: PracticeType[] = [
  'translation',
  'write',
  'listening',
  'article',
  'sentence',
  'pairs',
  'plural',
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
  lang?: LanguageCode;
  deckId?: string | null;
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
  lang: LanguageCode;
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

/* ------------------------------- Свои списки ------------------------------ */

/**
 * «Мои списки» (этап 8Б): человек сам собирает слова для учёбы, как плейлисты.
 * Список хранит id карточек из «Мои карточки» — одно слово может быть в нескольких списках.
 */
export interface StudyList {
  id: string;
  title: string;
  /** Необязательный значок-эмодзи. */
  emoji: string;
  cardIds: string[];
  createdAt: number;
  updatedAt: number;
}

/** Больше списков на аккаунт сервер не принимает. */
export const STUDY_LIST_MAX = 100;
/** Слов в одном списке. */
export const STUDY_LIST_CARDS_MAX = 500;

/* ------------------------- Синхронизация с аккаунтом ------------------------ */

export interface StudySyncRequest {
  cards?: StudyCard[];
  progress?: StudyProgress[];
  days?: StudyDay[];
  /** Свои списки слов (этап 8Б). */
  lists?: StudyList[];
}

export interface StudySyncResponse {
  cards: StudyCard[];
  progress: StudyProgress[];
  days: StudyDay[];
  lists: StudyList[];
  /** Время сервера — передайте его в следующий ?since=. */
  serverTime: number;
  /** Карточки, которые не поместились в лимит аккаунта и удалены сервером. */
  removed: string[];
  /** Списки, которые не поместились в лимит аккаунта и удалены сервером. */
  removedLists?: string[];
}

/** Счётчики для админки; отправляются один раз за сессию, а не на каждую карточку. */
export interface StudyPingRequest {
  reviews?: number;
  exercises?: number;
}

/* ------------------------------- Готовые наборы ---------------------------- */

/** Перевод слова для готовых наборов: русский, украинский, английский и немецкий. */
export interface DeckTranslations {
  ru: string;
  uk: string;
  en: string;
  de?: string;
}

/** Слово из готового набора: переводы сразу на языках набора. */
export interface DeckWord {
  lemma: string;
  article: StudyArticle | null;
  plural: string | null;
  partOfSpeech: PartOfSpeech;
  translations: DeckTranslations;
  example: StudyExample | null;
  lang?: LanguageCode;
}

export interface StudyDeck {
  id: string;
  level: 'A1' | 'A2' | 'B1';
  lang?: LanguageCode;
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
  level?: 'A1' | 'A2' | 'B1';
}

/* -------------------------------- Настройки -------------------------------- */

/** Больше карточек на аккаунт сервер не принимает. */
export const STUDY_MAX_CARDS = 3000;
/** Карточек в одной сессии повторения. */
export const STUDY_SESSION_MAX = 20;
/** Новых карточек в день по умолчанию (настройка). */
export const STUDY_NEW_PER_DAY_DEFAULT = 10;
/** Варианты цели дня в карточках (этап 16: 5, 10, 20 слов). */
export const STUDY_GOALS = [5, 10, 20] as const;
/** День засчитан, если повторено столько карточек или сделано одно упражнение. */
export const STUDY_STREAK_REVIEWS = 10;

/** Постоянный id карточки: одно слово — одна карточка на всех устройствах. */
export function studyCardId(lemma: string, lang: LanguageCode = 'de'): string {
  return `${lang}:${lemma.trim().toLowerCase()}`;
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
  const isEn = word.lang === 'en' || Boolean(word.translations.de && !word.article);
  if (language === 'de') {
    return isEn ? (word.translations.de || word.translations.en || word.translations.ru) : (word.translations.en || word.translations.ru);
  }
  if (language === 'en') {
    return isEn ? (word.translations.ru || word.translations.uk) : (word.translations.en || word.translations.ru);
  }
  if (language === 'uk') return word.translations.uk || word.translations.ru;
  return word.translations.ru;
}
