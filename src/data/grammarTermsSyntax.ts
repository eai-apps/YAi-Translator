/**
 * Словарь терминов: порядок слов, предложения, предлоги. (версия 0.6.0).
 * Результат собирается в словарь тем в grammarTermsData.ts; поиск по тексту — в grammarTerms.ts.
 */
import type { GrammarTermEntry } from './grammarTermTypes';

export const TERMS_SYNTAX: GrammarTermEntry[] = [
  {
    slug: 'word-order-main-clause',
    aliases: ['Wortstellung', 'Hauptsatz', 'порядок слов', 'главное предложение', 'word order', 'main clause'],
    patterns: ['порядок слов', 'порядк\\w* слов'],
    skipInNotes: true,
  },

  {
    slug: 'word-order-subordinate',
    aliases: ['Nebensatz', 'придаточное предложение', 'subordinate clause', 'subordinate clauses'],
    patterns: ['придаточн\\w* предложени\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'word-order-questions',
    aliases: ['Wortstellung in Fragen', 'вопрос', 'вопросительное предложение', 'question word order'],
    patterns: ['порядок слов в вопрос\\w*'],
    skipInNotes: true,
  },

  { slug: 'tekamolo', aliases: ['TeKaMoLo', 'порядок обстоятельств'], skipInNotes: true },

  {
    slug: 'negation-nicht-kein',
    aliases: ['Verneinung', 'nicht/kein', 'nicht und kein', 'отрицание', 'negation', 'nicht'],
    patterns: ['отрицани\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'relative-clauses',
    aliases: ['Relativsatz', 'Relativsätze', 'относительное придаточное', 'относительные придаточные', 'relative clause', 'relative clauses'],
    patterns: ['относительн\\w* придаточн\\w*'],
  },

  {
    slug: 'infinitive-with-zu',
    aliases: ['Infinitiv mit zu', 'инфинитив с zu', 'Инфинитивный оборот', 'infinitive with zu', 'zu + Infinitiv'],
    patterns: ['инфинитивн\\w* оборот\\w*'],
  },

  {
    slug: 'conjunctions-weil-denn-da',
    aliases: ['weil', 'denn', 'da', 'weil-Satz', 'denn-Satz', 'причина', 'reason clause'],
    patterns: ['союз\\w* причин\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'conjunctions-obwohl-trotzdem',
    aliases: ['obwohl', 'trotzdem', 'уступка', 'concession'],
    skipInNotes: true,
  },

  { slug: 'conjunctions-dass', aliases: ['dass', 'dass-Satz'], skipInNotes: true },

  { slug: 'conjunctions-ob', aliases: ['ob', 'ob-Satz'], skipInNotes: true },
];
