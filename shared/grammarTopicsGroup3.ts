/**
 * Третья группа тем справочника: синтаксис, союзы, предлоги, числа и время, стиль.
 * Складывается в общий список в grammarTopics.ts.
 */
import type { GrammarTopicSeed } from './grammarTopicTypes';

export const TOPICS_GROUP_3: GrammarTopicSeed[] = [
  // ───────────────────────── Синтаксис ─────────────────────────
  { slug: 'word-order-main-clause', category: 'syntax', level: 'A1', titleRu: 'Порядок слов в главном предложении', titleDe: 'Wortstellung im Hauptsatz', titleEn: 'Word order in main clauses' },
  { slug: 'word-order-subordinate', category: 'syntax', level: 'A2', titleRu: 'Порядок слов в придаточном предложении', titleDe: 'Wortstellung im Nebensatz', titleEn: 'Word order in subordinate clauses' },
  { slug: 'word-order-questions', category: 'syntax', level: 'A1', titleRu: 'Порядок слов в вопросах', titleDe: 'Wortstellung in Fragen', titleEn: 'Word order in questions' },
  { slug: 'tekamolo', category: 'syntax', level: 'A2', titleRu: 'TeKaMoLo: порядок обстоятельств', titleDe: 'TeKaMoLo', titleEn: 'TeKaMoLo' },
  { slug: 'negation-nicht-kein', category: 'syntax', level: 'A1', titleRu: 'Отрицание nicht и kein', titleDe: 'Verneinung mit nicht und kein', titleEn: 'Negation with nicht and kein' },
  { slug: 'relative-clauses', category: 'syntax', level: 'B1', titleRu: 'Относительные придаточные', titleDe: 'Relativsätze', titleEn: 'Relative clauses' },
  { slug: 'infinitive-with-zu', category: 'syntax', level: 'A2', titleRu: 'Инфинитив с zu', titleDe: 'Infinitiv mit zu', titleEn: 'Infinitive with zu' },

];
