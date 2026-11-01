/**
 * Начальный список тем справочника грамматики (версия 0.6.0).
 * Сам список разбит на пять файлов групп (артикли…местоимения / времена / синтаксис / наклонения и глаголы /
 * союзы), здесь — проверки, типы и единый массив. Рядом с каждой темой имя функции,
 * которая отдаёт её ссылки на открытые источники (grammarLinks.ts).
 * Меняешь список — меняй и migrations/0005_grammar.sql (тот же набор тем).
 */
import { TOPICS_GROUP_1 } from './grammarTopicsGroup1';
import { TOPICS_GROUP_2 } from './grammarTopicsGroup2';
import { TOPICS_GROUP_3 } from './grammarTopicsGroup3';
import { TOPICS_GROUP_4 } from './grammarTopicsGroup4';
import { TOPICS_GROUP_5 } from './grammarTopicsGroup5';

export type { GrammarTopicSeed } from './grammarTopicTypes';

export const GRAMMAR_CATEGORIES = [
  'articles',
  'nouns',
  'cases',
  'adjectives',
  'pronouns',
  'tenses',
  'moods',
  'voice',
  'verbs',
  'syntax',
  'conjunctions',
  'prepositions',
  'numbers',
  'style',
] as const;

export type GrammarCategory = (typeof GRAMMAR_CATEGORIES)[number];

export function isGrammarCategory(value: unknown): value is GrammarCategory {
  return typeof value === 'string' && (GRAMMAR_CATEGORIES as readonly string[]).includes(value);
}

/** Уровень темы: общий для всех языков справочника. */
export const GRAMMAR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export type GrammarLevel = (typeof GRAMMAR_LEVELS)[number];

export function isGrammarLevel(value: unknown): value is GrammarLevel {
  return typeof value === 'string' && (GRAMMAR_LEVELS as readonly string[]).includes(value);
}

/** Все темы немецкого справочника: 69 штук в пяти группах. */
export const GERMAN_GRAMMAR_TOPICS = [
  ...TOPICS_GROUP_1,
  ...TOPICS_GROUP_2,
  ...TOPICS_GROUP_3,
  ...TOPICS_GROUP_4,
  ...TOPICS_GROUP_5,
];

/** Все известные slug справочника немецкой грамматики. */
export const GERMAN_GRAMMAR_SLUGS: string[] = GERMAN_GRAMMAR_TOPICS.map((topic) => topic.slug);

export function isGermanGrammarSlug(value: unknown): value is string {
  return typeof value === 'string' && GERMAN_GRAMMAR_SLUGS.includes(value);
}

export { ENGLISH_GRAMMAR_TOPICS, ENGLISH_GRAMMAR_SLUGS, isEnglishGrammarSlug } from './grammarEnglishTopics';
