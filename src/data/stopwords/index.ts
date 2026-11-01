/**
 * Единый реестр стоп-слов для всех языков приложения (stopwords-iso, MIT).
 */
import { STOPWORDS_DE } from './de';
import { STOPWORDS_EN } from './en';
import { STOPWORDS_RU } from './ru';
import { STOPWORDS_UK } from './uk';
import { STOPWORDS_FR } from './fr';
import { STOPWORDS_ES } from './es';
import { STOPWORDS_IT } from './it';
import { STOPWORDS_PT } from './pt';
import { STOPWORDS_PL } from './pl';
import { STOPWORDS_NL } from './nl';
import { STOPWORDS_TR } from './tr';
import { STOPWORDS_AR } from './ar';

const MAP: Record<string, Set<string>> = {
  de: STOPWORDS_DE,
  en: STOPWORDS_EN,
  ru: STOPWORDS_RU,
  uk: STOPWORDS_UK,
  fr: STOPWORDS_FR,
  es: STOPWORDS_ES,
  it: STOPWORDS_IT,
  pt: STOPWORDS_PT,
  pl: STOPWORDS_PL,
  nl: STOPWORDS_NL,
  tr: STOPWORDS_TR,
  ar: STOPWORDS_AR,
};

export function getStopWords(lang: string): Set<string> {
  return MAP[lang] || STOPWORDS_EN;
}

export function isStopWord(word: string, lang = 'de'): boolean {
  const set = MAP[lang] || STOPWORDS_EN;
  return set.has(word.trim().toLowerCase());
}

export {
  STOPWORDS_DE,
  STOPWORDS_EN,
  STOPWORDS_RU,
  STOPWORDS_UK,
  STOPWORDS_FR,
  STOPWORDS_ES,
  STOPWORDS_IT,
  STOPWORDS_PT,
  STOPWORDS_PL,
  STOPWORDS_NL,
  STOPWORDS_TR,
  STOPWORDS_AR,
};
