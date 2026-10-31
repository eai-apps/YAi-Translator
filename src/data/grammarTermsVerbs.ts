/**
 * Словарь терминов: времена, наклонения, залог и глаголы. (версия 0.6.0).
 * Результат собирается в словарь тем в grammarTermsData.ts; поиск по тексту — в grammarTerms.ts.
 */
import type { GrammarTermEntry } from './grammarTermTypes';

export const TERMS_VERBS: GrammarTermEntry[] = [
  {
    slug: 'praesens',
    aliases: ['Präsens', 'Praesens', 'презенс', 'настоящее время', 'present tense', 'present simple'],
    patterns: ['настоящ\\w* врем\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'perfekt',
    aliases: ['Perfekt', 'перфект', 'perfect tense', 'present perfect'],
    patterns: ['перфект\\w*'],
    stems: ['Perfekt'],
  },

  {
    slug: 'perfekt-haben-sein',
    aliases: ['Perfekt mit haben und sein', 'Perfekt mit sein', 'вспомогательный глагол', 'вспомогательные глаголы', 'auxiliary verb', 'auxiliary verbs', 'haben oder sein'],
    patterns: ['вспомогательн\\w* глагол\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'praeteritum',
    aliases: ['Präteritum', 'Praeteritum', 'претеритум', 'прошедшее простое', 'simple past', 'past tense', 'preterite'],
    patterns: ['претерит\\w*', 'прошедш\\w* прост\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'plusquamperfekt',
    aliases: ['Plusquamperfekt', 'плюсквамперфект', 'предпрошедшее', 'past perfect'],
    skipInNotes: true,
  },

  { slug: 'futur-1', aliases: ['Futur I', 'Futur 1', 'футурум', 'будущее время', 'future tense', 'future i', 'Future 1'] },

  { slug: 'futur-2', aliases: ['Futur II', 'Futur 2', 'future perfect', 'future ii', 'Future 2'] },

  {
    slug: 'partizip-2',
    aliases: ['Partizip II', 'Partizip Perfekt', 'партицип', 'причастие прошедшего времени', 'past participle', 'participle ii'],
    patterns: ['причастие прошедш\\w* врем\\w*'],
    skipInNotes: true,
  },

  { slug: 'tenses-overview', aliases: ['времена', 'время глагола', 'tenses', 'verb tenses'], skipInNotes: true },

  {
    slug: 'konjunktiv-1',
    aliases: ['Konjunktiv I', 'Konjunktiv 1', 'конъюнктив I', 'сослагательное наклонение I', 'subjunctive i', 'subjunctive 1'],
    skipInNotes: true,
  },

  {
    slug: 'konjunktiv-2',
    aliases: [
      'Konjunktiv II',
      'Konjunktiv 2',
      'конъюнктив II',
      'сослагательное наклонение II',
      'сослагательное наклонение',
      'subjunctive ii',
      'subjunctive 2',
      'subjunctive',
      'сослагательное',
    ],
    // Голые «würde», «hätte», «wäre» — обычные глагольные формы, а не название темы.
    skipInNotes: true,
  },

  {
    slug: 'konjunktiv-2-wuerde',
    aliases: ['Konjunktiv II mit würde', 'сослагательное с würde', 'would+infinitive'],
    patterns: ['würde-(?:Form|Konstruktion)'],
    skipInNotes: true,
  },

  {
    slug: 'konjunktiv-2-haette-waere',
    aliases: ['hätte und wäre', 'hätte/wäre', 'сослагательное hätte', 'сослагательное wäre'],
    skipInNotes: true,
  },

  {
    slug: 'konjunktiv-2-modal',
    aliases: ['Konjunktiv II модальных глаголов', 'сослагательное модальных глаголов', 'subjunctive of modal verbs'],
    patterns: ['könnte-,? müsste-,? sollte-?'],
    skipInNotes: true,
  },

  {
    slug: 'imperativ',
    aliases: ['Imperativ', 'императив', 'повелительное наклонение', 'imperative', 'command form'],
    patterns: ['повелительн\\w* наклонени\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'indirekte-rede',
    aliases: ['indirekte Rede', 'косвенная речь', 'reported speech', 'indirect speech'],
    patterns: ['косвенн\\w* реч\\w*'],
    skipInNotes: true,
  },

  { slug: 'passiv', aliases: ['Passiv', 'пассив', 'пассивный залог', 'страдательный залог', 'passive', 'passive voice'], patterns: ['пассивн\\w* залог\\w*', 'страдательн\\w* залог\\w*'], skipInNotes: true },

  { slug: 'vorgangspassiv', aliases: ['Vorgangspassiv', 'werden-Passiv'], skipInNotes: true },

  { slug: 'zustandspassiv', aliases: ['Zustandspassiv', 'sein-Passiv'], skipInNotes: true },

  {
    slug: 'modalverben',
    aliases: ['Modalverben', 'Modalverb', 'модальные глаголы', 'модальный глагол', 'modal verb', 'modal verbs'],
    patterns: ['модальн\\w* глагол\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'reflexive-verbs',
    aliases: ['reflexive Verben', 'reflexives Verb', 'возвратные глаголы', 'возвратный глагол', 'reflexive verb', 'reflexive verbs'],
    patterns: ['возвратн\\w* глагол\\w*'],
  },

  {
    slug: 'separable-verbs',
    aliases: ['trennbare Verben', 'trennbares Verb', 'отделяемая приставка', 'отделяемые приставки', 'separable verb', 'separable verbs', 'separable prefix'],
    patterns: ['отделяем\\w* приставк\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'inseparable-verbs',
    aliases: ['untrennbare Verben', 'неотделяемая приставка', 'неотделяемые приставки', 'inseparable verb', 'inseparable verbs'],
    patterns: ['неотделяем\\w* приставк\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'strong-verbs',
    aliases: ['starke Verben', 'unregelmäßige Verben', 'сильные глаголы', 'неправильные глаголы', 'strong verbs', 'irregular verbs'],
    patterns: ['сильн\\w* глагол\\w*', 'неправильн\\w* глагол\\w*'],
  },

  {
    slug: 'verbs-with-prepositions',
    aliases: ['Verben mit Präpositionen', 'глаголы с предлогами', 'управление глагола', 'verben mit präposition', 'verbs with prepositions'],
    patterns: ['глагол\\w* с предлог\\w*', 'управлени\\w* глагол\\w*'],
    skipInNotes: true,
  },
];
