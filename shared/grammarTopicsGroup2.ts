/**
 * Вторая группа тем справочника: времена, наклонения, залог, глаголы.
 * Складывается в общий список в grammarTopics.ts.
 */
import type { GrammarTopicSeed } from './grammarTopicTypes';

export const TOPICS_GROUP_2: GrammarTopicSeed[] = [
  // ───────────────────────── Времена ─────────────────────────
  { slug: 'praesens', category: 'tenses', level: 'A1', titleRu: 'Präsens: настоящее время', titleDe: 'Präsens', titleEn: 'Present tense' },
  { slug: 'perfekt', category: 'tenses', level: 'A1', titleRu: 'Perfekt', titleDe: 'Perfekt', titleEn: 'Perfect tense' },
  { slug: 'perfekt-haben-sein', category: 'tenses', level: 'A2', titleRu: 'Perfekt с haben и sein', titleDe: 'Perfekt mit haben und sein', titleEn: 'Perfect with haben and sein' },
  { slug: 'praeteritum', category: 'tenses', level: 'A2', titleRu: 'Präteritum', titleDe: 'Präteritum', titleEn: 'Simple past' },
  { slug: 'plusquamperfekt', category: 'tenses', level: 'B1', titleRu: 'Plusquamperfekt', titleDe: 'Plusquamperfekt', titleEn: 'Past perfect' },
  { slug: 'futur-1', category: 'tenses', level: 'A2', titleRu: 'Futur I', titleDe: 'Futur I', titleEn: 'Future I' },
  { slug: 'futur-2', category: 'tenses', level: 'B1', titleRu: 'Futur II', titleDe: 'Futur II', titleEn: 'Future II' },
  { slug: 'partizip-2', category: 'tenses', level: 'A2', titleRu: 'Partizip II', titleDe: 'Partizip II', titleEn: 'Past participle' },
  { slug: 'tenses-overview', category: 'tenses', level: 'A2', titleRu: 'Все времена: что и когда', titleDe: 'Zeiten im Überblick', titleEn: 'Tenses at a glance' },

];
