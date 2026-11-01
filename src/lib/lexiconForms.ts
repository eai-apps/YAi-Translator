/**
 * Реэкспорт построения форм слов (этап 15Б, версия 0.17.5).
 * Основная логика вынесена в shared/lexiconForms.ts для общего доступа.
 */
export {
  buildVerbConjugation,
  buildNounDeclension,
  getAdjComparison,
  SPECIAL_VERBS,
} from '../../shared/lexiconForms';
export type { SpecialVerbData } from '../../shared/lexiconForms';
