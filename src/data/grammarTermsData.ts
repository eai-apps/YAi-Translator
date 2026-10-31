/**
 * Словарь «термин в тексте → slug темы справочника» (версия 0.6.0).
 * Собран из четырёх файлов по группам тем (существительные, глаголы, синтаксис, стиль).
 * Для общих терминов (Passiv, «падеж», sollte) стоит skipInNotes: в «Что важно знать»
 * такие слова не подчёркиваем, иначе весь текст превратится в ссылки.
 * Поиск по тексту — в grammarTerms.ts (findGrammarTerms) и grammarHighlight.ts.
 */
import type { GrammarTermEntry } from './grammarTermTypes';
import { TERMS_NOUNS } from './grammarTermsNouns';
import { TERMS_STYLE } from './grammarTermsStyle';
import { TERMS_SYNTAX } from './grammarTermsSyntax';
import { TERMS_VERBS } from './grammarTermsVerbs';

export const GRAMMAR_TERMS: GrammarTermEntry[] = [...TERMS_NOUNS, ...TERMS_VERBS, ...TERMS_SYNTAX, ...TERMS_STYLE];
