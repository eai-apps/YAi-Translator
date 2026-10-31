/**
 * Четвёртая группа тем справочника: наклонения (Konjunktiv, Imperativ), залог Passiv и глаголы.
 * Складывается в общий список в grammarTopics.ts.
 */
import type { GrammarTopicSeed } from './grammarTopicTypes';

export const TOPICS_GROUP_4: GrammarTopicSeed[] = [
  // ───────────────────────── Наклонения ─────────────────────────
  { slug: 'konjunktiv-1', category: 'moods', level: 'B2', titleRu: 'Konjunktiv I: косвенная речь', titleDe: 'Konjunktiv I', titleEn: 'Subjunctive I' },
  { slug: 'konjunktiv-2', category: 'moods', level: 'B1', titleRu: 'Konjunktiv II: сослагательное наклонение', titleDe: 'Konjunktiv II', titleEn: 'Subjunctive II' },
  { slug: 'konjunktiv-2-wuerde', category: 'moods', level: 'B1', titleRu: 'Konjunktiv II с würde', titleDe: 'Konjunktiv II mit würde', titleEn: 'Subjunctive II with würde' },
  { slug: 'konjunktiv-2-haette-waere', category: 'moods', level: 'B1', titleRu: 'Konjunktiv II: hätte и wäre', titleDe: 'Konjunktiv II: hätte, wäre', titleEn: 'Subjunctive II: hätte, wäre' },
  { slug: 'konjunktiv-2-modal', category: 'moods', level: 'B2', titleRu: 'Konjunktiv II модальных глаголов', titleDe: 'Konjunktiv II der Modalverben', titleEn: 'Subjunctive II of modal verbs' },
  { slug: 'imperativ', category: 'moods', level: 'A1', titleRu: 'Повелительное наклонение', titleDe: 'Imperativ', titleEn: 'Imperative' },
  { slug: 'indirekte-rede', category: 'moods', level: 'B2', titleRu: 'Косвенная речь', titleDe: 'Indirekte Rede', titleEn: 'Reported speech' },

  // ───────────────────────── Залог ─────────────────────────
  { slug: 'passiv', category: 'voice', level: 'B1', titleRu: 'Passiv: обзор', titleDe: 'Passiv', titleEn: 'Passive voice' },
  { slug: 'vorgangspassiv', category: 'voice', level: 'B1', titleRu: 'Vorgangspassiv: действие', titleDe: 'Vorgangspassiv', titleEn: 'Process passive' },
  { slug: 'zustandspassiv', category: 'voice', level: 'B2', titleRu: 'Zustandspassiv: состояние', titleDe: 'Zustandspassiv', titleEn: 'State passive' },

  // ───────────────────────── Глаголы ─────────────────────────
  { slug: 'modalverben', category: 'verbs', level: 'A1', titleRu: 'Модальные глаголы', titleDe: 'Modalverben', titleEn: 'Modal verbs' },
  { slug: 'reflexive-verbs', category: 'verbs', level: 'A2', titleRu: 'Возвратные глаголы', titleDe: 'Reflexive Verben', titleEn: 'Reflexive verbs' },
  { slug: 'separable-verbs', category: 'verbs', level: 'A2', titleRu: 'Отделяемые приставки', titleDe: 'Trennbare Verben', titleEn: 'Separable verbs' },
  { slug: 'inseparable-verbs', category: 'verbs', level: 'A2', titleRu: 'Неотделяемые приставки', titleDe: 'Untrennbare Verben', titleEn: 'Inseparable verbs' },
  { slug: 'strong-verbs', category: 'verbs', level: 'A2', titleRu: 'Сильные и неправильные глаголы', titleDe: 'Starke und unregelmäßige Verben', titleEn: 'Strong and irregular verbs' },
  { slug: 'verbs-with-prepositions', category: 'verbs', level: 'B1', titleRu: 'Глаголы с предлогами', titleDe: 'Verben mit Präpositionen', titleEn: 'Verbs with prepositions' },
];
