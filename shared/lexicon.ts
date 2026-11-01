/**
 * Общие типы для статической базы слов (этап 11, этап 14).
 * Хранится в public/lex/<lang>/<xx>.json, где xx — первые 2 буквы слова в нижнем регистре.
 */

import type { CefrLevel } from './typeCore';

export type LexiconGender = 'der' | 'die' | 'das' | 'm' | 'f' | 'n';
export type LexiconPos = 'n' | 'v' | 'adj' | 'adv' | 'other';

/** Переводы на другие языки (ru, de, en, uk): до 4 вариантов на язык */
export type LexiconTranslations = Partial<Record<'ru' | 'de' | 'en' | 'uk' | string, string[]>>;

/**
 * Вычисление примерного уровня CEFR по рангу частоты (Hermit Dave / OpenSubtitles):
 * <= 1000: A1, <= 2000: A2, <= 4000: B1, <= 8000: B2, иначе C1+
 */
export function getCefrLevel(rank?: number): CefrLevel | null {
  if (!rank || rank <= 0) return null;
  if (rank <= 1000) return 'A1';
  if (rank <= 2000) return 'A2';
  if (rank <= 4000) return 'B1';
  if (rank <= 8000) return 'B2';
  return 'C1+';
}

/** Базовые общие поля для полноценной словарной статьи (этап 15) */
export interface BaseLexiconEntry {
  ipa?: string;
  ipaUk?: string;
  ipaUs?: string;
  tr?: LexiconTranslations;
  /** Ранг частотности слова в языке (1 = самое частое) */
  fr?: number;
  /** Ссылка на человеческое произношение Wikimedia Commons / Lingua Libre (mp3) */
  audio?: string;
  /** Синонимы слова (OpenThesaurus, Wiktionary, WordNet) */
  syn?: string[];
}

/** Существительное: род, мн. число, Genitiv, транскрипция, переводы, частота, аудио, синонимы. */
export interface LexiconNounEntry extends BaseLexiconEntry {
  pos: 'n';
  g?: LexiconGender;
  pl?: string;
  gen?: string;
}

/** Глагол: Präsens 3 л., Präteritum, Partizip II, вспомогательный глагол, транскрипция, переводы, частота, аудио, синонимы. */
export interface LexiconVerbEntry extends BaseLexiconEntry {
  pos: 'v';
  p3?: string;
  prt?: string;
  p2?: string;
  aux?: 'haben' | 'sein';
}

/** Прилагательное: сравнительная и превосходная степени, транскрипция, переводы, частота, аудио, синонимы. */
export interface LexiconAdjEntry extends BaseLexiconEntry {
  pos: 'adj';
  comp?: string;
  sup?: string;
}

/** Другая часть речи. */
export interface LexiconOtherEntry extends BaseLexiconEntry {
  pos?: 'adv' | 'other';
}

/** Ссылка с формы слова на основную лемму: «went» → «go», «Häuser» → «Haus». */
export interface LexiconRefEntry {
  lemma: string;
}

export type LexiconEntry =
  | LexiconNounEntry
  | LexiconVerbEntry
  | LexiconAdjEntry
  | LexiconOtherEntry
  | LexiconRefEntry;

/** Файл-шард словаря: слово/форма → запись. */
export type LexiconChunk = Record<string, LexiconEntry>;

/** Метаданные базы в public/lex/<lang>/meta.json. */
export interface LexiconMeta {
  version: string;
  lang: string;
  date: string;
  entries: number;
  sources: Array<{ name: string; url: string; license: string }>;
}

/** Предложение-пример из базы Tatoeba (этап 15) */
export interface ExampleSentence {
  id: number;
  text: string;
  tr: Partial<Record<'ru' | 'de' | 'en' | 'uk' | string, string>>;
  audio?: string;
  license?: string;
}

/** Файл-шард примеров public/ex/<lang>/<xx>.json */
export type ExampleChunk = Record<string, ExampleSentence[]>;

/** Префикс файла (первые 2 буквы в нижнем регистре, поддержка Unicode). */
export function getLexiconPrefix(word: string): string {
  const clean = word.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (clean.length < 2) return 'other';
  return clean.slice(0, 2);
}

/** Проверка: является ли запись ссылкой на другую лемму. */
export function isLexiconRef(entry: LexiconEntry): entry is LexiconRefEntry {
  return Boolean(entry && typeof (entry as LexiconRefEntry).lemma === 'string' && !(entry as any).pos);
}

export type ResolvedLexiconEntry =
  | LexiconNounEntry
  | LexiconVerbEntry
  | LexiconAdjEntry
  | LexiconOtherEntry;

export function isResolvedEntry(entry?: LexiconEntry | null): entry is ResolvedLexiconEntry {
  return Boolean(
    entry &&
      (typeof (entry as any).pos === 'string' ||
        (typeof (entry as any).tr === 'object' && (entry as any).tr !== null))
  );
}
