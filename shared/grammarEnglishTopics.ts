/**
 * Начальный список тем справочника английской грамматики (этап 18, версия 0.20.0).
 * Формат совместим с немецким справочником (GrammarTopicSeed).
 */
import type { GrammarTopicSeed } from './grammarTopicTypes';

export const ENGLISH_GRAMMAR_TOPICS: GrammarTopicSeed[] = [
  // ───────────────────────── Времена (Tenses) ─────────────────────────
  {
    slug: 'en-present-simple',
    category: 'tenses',
    level: 'A1',
    titleRu: 'Present Simple: регулярные действия и факты',
    titleDe: 'Present Simple: Regelmäßige Handlungen und Fakten',
    titleEn: 'Present Simple: Regular actions and facts',
  },
  {
    slug: 'en-present-continuous',
    category: 'tenses',
    level: 'A1',
    titleRu: 'Present Continuous: действие прямо сейчас',
    titleDe: 'Present Continuous: Handlungen im Moment des Sprechens',
    titleEn: 'Present Continuous: Actions happening right now',
  },
  {
    slug: 'en-present-perfect',
    category: 'tenses',
    level: 'A2',
    titleRu: 'Present Perfect: опыт и результат к настоящему',
    titleDe: 'Present Perfect: Erfahrungen und Ergebnisse bis zur Gegenwart',
    titleEn: 'Present Perfect: Past actions with present result',
  },
  {
    slug: 'en-past-simple',
    category: 'tenses',
    level: 'A1',
    titleRu: 'Past Simple: завершённые действия в прошлом',
    titleDe: 'Past Simple: Abgeschlossene Handlungen in der Vergangenheit',
    titleEn: 'Past Simple: Completed past actions',
  },
  {
    slug: 'en-past-continuous',
    category: 'tenses',
    level: 'A2',
    titleRu: 'Past Continuous: процесс в определённый момент прошлого',
    titleDe: 'Past Continuous: Verlauf zu einem bestimmten Zeitpunkt der Vergangenheit',
    titleEn: 'Past Continuous: Actions in progress in the past',
  },
  {
    slug: 'en-past-perfect',
    category: 'tenses',
    level: 'B1',
    titleRu: 'Past Perfect: предпрошедшее время',
    titleDe: 'Past Perfect: Vorvergangenheit',
    titleEn: 'Past Perfect: Action completed before another past event',
  },
  {
    slug: 'en-future-simple',
    category: 'tenses',
    level: 'A2',
    titleRu: 'Будущее время: will и to be going to',
    titleDe: 'Zukunft: will und to be going to',
    titleEn: 'Future forms: will vs. to be going to',
  },
  {
    slug: 'en-future-continuous-perfect',
    category: 'tenses',
    level: 'B2',
    titleRu: 'Future Continuous и Future Perfect',
    titleDe: 'Future Continuous und Future Perfect',
    titleEn: 'Future Continuous and Future Perfect',
  },

  // ───────────────────────── Артикли ─────────────────────────
  {
    slug: 'en-articles',
    category: 'articles',
    level: 'A1',
    titleRu: 'Артикли a, an, the и нулевой артикль',
    titleDe: 'Artikel: a, an, the und Nullartikel',
    titleEn: 'Articles: a, an, the and zero article',
  },

  // ───────────────────────── Модальные глаголы ─────────────────────────
  {
    slug: 'en-modal-verbs',
    category: 'verbs',
    level: 'A2',
    titleRu: 'Модальные глаголы: can, could, may, might, must, should',
    titleDe: 'Modalverben: can, could, may, might, must, should',
    titleEn: 'Modal verbs: can, could, may, might, must, should',
  },

  // ───────────────────────── Условные предложения ─────────────────────────
  {
    slug: 'en-conditionals',
    category: 'syntax',
    level: 'B1',
    titleRu: 'Условные предложения: Conditionals 0, 1, 2, 3',
    titleDe: 'Bedingungssätze: Conditionals 0, 1, 2, 3',
    titleEn: 'Conditionals: Zero, First, Second, Third',
  },

  // ───────────────────────── Пассивный залог ─────────────────────────
  {
    slug: 'en-passive-voice',
    category: 'voice',
    level: 'B1',
    titleRu: 'Пассивный залог (Passive Voice)',
    titleDe: 'Passiv (Passive Voice)',
    titleEn: 'Passive Voice across tenses',
  },

  // ───────────────────────── Неправильные глаголы ─────────────────────────
  {
    slug: 'en-irregular-verbs',
    category: 'verbs',
    level: 'A1',
    titleRu: 'Неправильные глаголы (Irregular Verbs)',
    titleDe: 'Unregelmäßige Verben (Irregular Verbs)',
    titleEn: 'Irregular verbs reference table',
  },

  // ───────────────────────── Предлоги ─────────────────────────
  {
    slug: 'en-prepositions',
    category: 'prepositions',
    level: 'A1',
    titleRu: 'Предлоги времени и места: in, on, at',
    titleDe: 'Präpositionen für Zeit und Ort: in, on, at',
    titleEn: 'Prepositions of time and place: in, on, at',
  },

  // ───────────────────────── Фразовые глаголы ─────────────────────────
  {
    slug: 'en-phrasal-verbs',
    category: 'verbs',
    level: 'B1',
    titleRu: 'Фразовые глаголы: топ-50 самых частых',
    titleDe: 'Phrasal Verbs: Top-50 der häufigsten',
    titleEn: 'Phrasal verbs: Top 50 essential verbs',
  },
];

export const ENGLISH_GRAMMAR_SLUGS = ENGLISH_GRAMMAR_TOPICS.map((topic) => topic.slug);

export function isEnglishGrammarSlug(value: unknown): value is string {
  return typeof value === 'string' && ENGLISH_GRAMMAR_SLUGS.includes(value);
}
