/** Разбор кода языка ИИ и словарные ключи для подписей. */
import type { CefrLevel, GrammaticalCase, PartOfSpeech, TranslationStyle } from '../../shared/types';

export function partOfSpeechKey(partOfSpeech: PartOfSpeech): string {
  const map: Record<PartOfSpeech, string> = {
    noun: 'word.posNoun',
    verb: 'word.posVerb',
    adjective: 'word.posAdjective',
    adverb: 'word.posAdverb',
    pronoun: 'word.posPronoun',
    preposition: 'word.posPreposition',
    conjunction: 'word.posConjunction',
    numeral: 'word.posNumeral',
    interjection: 'word.posInterjection',
    phrase: 'word.posPhrase',
    other: 'word.posOther',
  };
  return map[partOfSpeech];
}

export function grammaticalCaseKey(grammaticalCase: GrammaticalCase): string {
  const map: Record<GrammaticalCase, string> = {
    nominative: 'word.caseNom',
    accusative: 'word.caseAcc',
    dative: 'word.caseDat',
    genitive: 'word.caseGen',
  };
  return map[grammaticalCase];
}

export function translationStyleKey(style: TranslationStyle): string {
  const map: Record<TranslationStyle, string> = {
    neutral: 'translate.styleNeutral',
    colloquial: 'translate.styleColloquial',
    formal: 'translate.styleFormal',
  };
  return map[style];
}

export function correctionTypeKey(type: string): string {
  const map: Record<string, string> = {
    grammar: 'check.typeGrammar',
    spelling: 'check.typeSpelling',
    'word-order': 'check.typeWordOrder',
    vocabulary: 'check.typeVocabulary',
    punctuation: 'check.typePunctuation',
    style: 'check.typeStyle',
  };
  return map[type] ?? 'check.typeGrammar';
}

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2'];
