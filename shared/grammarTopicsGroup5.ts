/**
 * Пятая группа тем справочника: союзы и их альтернативы (weil/denn/da, obwohl/trotzdem, damit/um…zu).
 * Складывается в общий список в grammarTopics.ts.
 */
import type { GrammarTopicSeed } from './grammarTopicTypes';

export const TOPICS_GROUP_5: GrammarTopicSeed[] = [
  // ───────────────────────── Союзы ─────────────────────────
  { slug: 'conjunctions-weil-denn-da', category: 'conjunctions', level: 'A2', titleRu: 'weil, denn, da: причины', titleDe: 'weil, denn, da', titleEn: 'weil, denn, da (reason)' },
  { slug: 'conjunctions-obwohl-trotzdem', category: 'conjunctions', level: 'B1', titleRu: 'obwohl и trotzdem: уступка', titleDe: 'obwohl und trotzdem', titleEn: 'obwohl and trotzdem (concession)' },
  { slug: 'conjunctions-dass', category: 'conjunctions', level: 'A2', titleRu: 'Союз dass', titleDe: 'dass', titleEn: 'The conjunction dass' },
  { slug: 'conjunctions-ob', category: 'conjunctions', level: 'A2', titleRu: 'Косвенный вопрос с ob', titleDe: 'Indirekte Frage mit ob', titleEn: 'Indirect question with ob' },
  { slug: 'conjunctions-wenn-als', category: 'conjunctions', level: 'A2', titleRu: 'wenn и als: когда', titleDe: 'wenn und als', titleEn: 'wenn and als (when)' },
  { slug: 'conjunctions-damit-um-zu', category: 'conjunctions', level: 'B1', titleRu: 'damit и um … zu: цель', titleDe: 'damit und um … zu', titleEn: 'damit and um … zu (purpose)' },
  { slug: 'conjunctions-overview', category: 'conjunctions', level: 'B1', titleRu: 'Союзы: обзор и альтернативы', titleDe: 'Konjunktionen im Überblick', titleEn: 'Conjunctions overview' },

  // ───────────────────────── Предлоги ─────────────────────────
  { slug: 'prepositions-akkusativ', category: 'prepositions', level: 'A1', titleRu: 'Предлоги с Akkusativ', titleDe: 'Präpositionen mit Akkusativ', titleEn: 'Prepositions with the accusative' },
  { slug: 'prepositions-dativ', category: 'prepositions', level: 'A1', titleRu: 'Предлоги с Dativ', titleDe: 'Präpositionen mit Dativ', titleEn: 'Prepositions with the dative' },
  { slug: 'wechselpraepositionen', category: 'prepositions', level: 'A2', titleRu: 'Wechselpräpositionen: Wo? и Wohin?', titleDe: 'Wechselpräpositionen', titleEn: 'Two-way prepositions' },
  { slug: 'prepositions-genitiv', category: 'prepositions', level: 'B1', titleRu: 'Предлоги с Genitiv', titleDe: 'Präpositionen mit Genitiv', titleEn: 'Prepositions with the genitive' },

  // ───────────────────────── Числа и время ─────────────────────────
  { slug: 'numbers', category: 'numbers', level: 'A1', titleRu: 'Числительные', titleDe: 'Zahlwörter', titleEn: 'Numbers' },
  { slug: 'telling-time', category: 'numbers', level: 'A1', titleRu: 'Время и даты', titleDe: 'Uhrzeit und Datum', titleEn: 'Telling the time and dates' },

  // ───────────────────────── Стиль ─────────────────────────
  { slug: 'polite-forms', category: 'style', level: 'A1', titleRu: 'Вежливые формы: Sie и du', titleDe: 'Höfliche Anrede: Sie und du', titleEn: 'Polite forms: Sie and du' },
  { slug: 'academic-language', category: 'style', level: 'C1', titleRu: 'Письменный и научный язык', titleDe: 'Schriftsprache und Wissenschaftssprache', titleEn: 'Written and academic German' },
];
