/**
 * Словарь терминов: союзы, числа и время, вежливые формы, письменный язык. (версия 0.6.0).
 * Результат собирается в словарь тем в grammarTermsData.ts; поиск по тексту — в grammarTerms.ts.
 */
import type { GrammarTermEntry } from './grammarTermTypes';

export const TERMS_STYLE: GrammarTermEntry[] = [
  {
    slug: 'conjunctions-wenn-als',
    aliases: ['wenn', 'als', 'wenn-Satz', 'als-Satz', 'wenn/als'],
    skipInNotes: true,
  },

  {
    slug: 'conjunctions-damit-um-zu',
    aliases: ['damit', 'um … zu', 'um zu', 'um ... zu', 'цель', 'purpose clause'],
    skipInNotes: true,
  },

  {
    slug: 'conjunctions-overview',
    aliases: ['Konjunktionen', 'Konjunktion', 'союзы', 'союз', 'conjunction', 'conjunctions', 'союзы и связки'],
    patterns: ['союз\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'prepositions-akkusativ',
    aliases: ['Präpositionen mit Akkusativ', 'предлоги с Akkusativ', 'предлог с винительным падежом', 'prepositions with the accusative'],
    patterns: ['предлог\\w* с Akkusativ'],
    skipInNotes: true,
  },

  {
    slug: 'prepositions-dativ',
    aliases: ['Präpositionen mit Dativ', 'предлоги с Dativ', 'предлог с дательным падежом', 'prepositions with the dative'],
    patterns: ['предлог\\w* с Dativ'],
    skipInNotes: true,
  },

  {
    slug: 'wechselpraepositionen',
    aliases: [
      'Wechselpräpositionen',
      'Wechselpräposition',
      'предлоги места',
      'двойные предлоги',
      'two-way prepositions',
      'prepositions with dative and accusative',
    ],
    patterns: ['предлог\\w* места'],
  },

  {
    slug: 'prepositions-genitiv',
    aliases: ['Präpositionen mit Genitiv', 'предлоги с Genitiv', 'prepositions with the genitive'],
    patterns: ['предлог\\w* с Genitiv'],
    skipInNotes: true,
  },

  { slug: 'numbers', aliases: ['Zahlwörter', 'числительные', 'числительное', 'numbers', 'numerals'], patterns: ['числительн\\w*'], skipInNotes: true },

  { slug: 'telling-time', aliases: ['Uhrzeit', 'время и дата', 'время суток', 'telling the time', 'dates'], patterns: ['время и дат\\w*'], skipInNotes: true },

  {
    slug: 'polite-forms',
    aliases: ['Sie', 'Höflichkeitsform', 'höfliche Anrede', 'вежливая форма', 'вежливое обращение', 'polite form', 'polite forms', 'formal address'],
    patterns: ['вежлив\\w* форм\\w*', 'вежлив\\w* обращени\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'academic-language',
    aliases: ['Schriftsprache', 'Wissenschaftssprache', 'научный стиль', 'письменный язык', 'academic language', 'written german'],
    patterns: ['научн\\w* стил\\w*', 'письменн\\w* язык\\w*'],
    skipInNotes: true,
  },
];
