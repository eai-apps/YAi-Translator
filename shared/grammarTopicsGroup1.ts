/**
 * Первая группа тем справочника: артикли, существительные, падежи, прилагательные, местоимения.
 * Складывается в общий список в grammarTopics.ts вместе с остальными файлами группы.
 */
import type { GrammarTopicSeed } from './grammarTopicTypes';

export const TOPICS_GROUP_1: GrammarTopicSeed[] = [
  // ───────────────────────── Артикли ─────────────────────────
  { slug: 'definite-articles', category: 'articles', level: 'A1', titleRu: 'Определённый артикль der, die, das', titleDe: 'Bestimmter Artikel', titleEn: 'Definite articles' },
  { slug: 'indefinite-articles', category: 'articles', level: 'A1', titleRu: 'Неопределённый артикль ein, eine, ein', titleDe: 'Unbestimmter Artikel', titleEn: 'Indefinite articles' },
  { slug: 'negative-article-kein', category: 'articles', level: 'A1', titleRu: 'Отрицательный артикль kein', titleDe: 'Negativartikel kein', titleEn: 'Negative article kein' },
  { slug: 'possessive-articles', category: 'articles', level: 'A1', titleRu: 'Притяжательные артикли mein, dein, sein …', titleDe: 'Possessivartikel', titleEn: 'Possessive articles' },

  // ───────────────────────── Существительные ─────────────────────────
  { slug: 'noun-gender', category: 'nouns', level: 'A1', titleRu: 'Род существительных', titleDe: 'Genus der Substantive', titleEn: 'Noun gender' },
  { slug: 'noun-plurals', category: 'nouns', level: 'A1', titleRu: 'Множественное число существительных', titleDe: 'Plural der Substantive', titleEn: 'Noun plurals' },
  { slug: 'n-declension', category: 'nouns', level: 'A2', titleRu: 'n-склонение (слабое склонение существительных)', titleDe: 'n-Deklination', titleEn: 'n-declension (weak nouns)' },

  // ───────────────────────── Падежи ─────────────────────────
  { slug: 'cases-overview', category: 'cases', level: 'A1', titleRu: 'Падежи: обзор', titleDe: 'Die vier Fälle', titleEn: 'The four cases' },
  { slug: 'nominativ', category: 'cases', level: 'A1', titleRu: 'Nominativ', titleDe: 'Nominativ', titleEn: 'Nominative' },
  { slug: 'akkusativ', category: 'cases', level: 'A1', titleRu: 'Akkusativ', titleDe: 'Akkusativ', titleEn: 'Accusative' },
  { slug: 'dativ', category: 'cases', level: 'A1', titleRu: 'Dativ', titleDe: 'Dativ', titleEn: 'Dative' },
  { slug: 'genitiv', category: 'cases', level: 'B1', titleRu: 'Genitiv', titleDe: 'Genitiv', titleEn: 'Genitive' },

  // ───────────────────────── Прилагательные ─────────────────────────
  { slug: 'adjectives-overview', category: 'adjectives', level: 'A2', titleRu: 'Прилагательные: как они работают', titleDe: 'Adjektive: Grundlagen', titleEn: 'Adjectives: basics' },
  { slug: 'weak-declension', category: 'adjectives', level: 'A2', titleRu: 'Слабое склонение прилагательных', titleDe: 'Schwache Adjektivdeklination', titleEn: 'Weak adjective declension' },
  { slug: 'strong-declension', category: 'adjectives', level: 'A2', titleRu: 'Сильное склонение прилагательных', titleDe: 'Starke Adjektivdeklination', titleEn: 'Strong adjective declension' },
  { slug: 'mixed-declension', category: 'adjectives', level: 'A2', titleRu: 'Смешанное склонение прилагательных', titleDe: 'Gemischte Adjektivdeklination', titleEn: 'Mixed adjective declension' },
  { slug: 'adjective-comparison', category: 'adjectives', level: 'A2', titleRu: 'Степени сравнения прилагательных', titleDe: 'Komparativ und Superlativ', titleEn: 'Comparison of adjectives' },

  // ───────────────────────── Местоимения ─────────────────────────
  { slug: 'personal-pronouns', category: 'pronouns', level: 'A1', titleRu: 'Личные местоимения', titleDe: 'Personalpronomen', titleEn: 'Personal pronouns' },
  { slug: 'reflexive-pronouns', category: 'pronouns', level: 'A2', titleRu: 'Возвратные местоимения', titleDe: 'Reflexivpronomen', titleEn: 'Reflexive pronouns' },
  { slug: 'demonstrative-pronouns', category: 'pronouns', level: 'B1', titleRu: 'Указательные местоимения', titleDe: 'Demonstrativpronomen', titleEn: 'Demonstrative pronouns' },
  { slug: 'relative-pronouns', category: 'pronouns', level: 'B1', titleRu: 'Относительные местоимения', titleDe: 'Relativpronomen', titleEn: 'Relative pronouns' },
  { slug: 'indefinite-pronouns', category: 'pronouns', level: 'A2', titleRu: 'Неопределённые местоимения man, jemand, nichts', titleDe: 'Indefinitpronomen', titleEn: 'Indefinite pronouns' },
];
