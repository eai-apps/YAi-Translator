/**
 * Общие типы для статической базы немецких слов (этап 11).
 * Хранится в public/lex/de/<xx>.json, где xx — первые 2 буквы слова в нижнем регистре.
 */

export type LexiconGender = 'der' | 'die' | 'das';
export type LexiconPos = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';

/** Существительное: род, мн. число, Genitiv, транскрипция. */
export interface LexiconNounEntry {
  pos: 'n';
  g: LexiconGender;
  pl?: string;
  gen?: string;
  ipa?: string;
}

/** Глагол: Präsens 3 л., Präteritum, Partizip II, вспомогательный глагол, транскрипция. */
export interface LexiconVerbEntry {
  pos: 'v';
  p3?: string;
  prt?: string;
  p2?: string;
  aux?: 'haben' | 'sein';
  ipa?: string;
}

/** Прилагательное: сравнительная и превосходная степени, транскрипция. */
export interface LexiconAdjEntry {
  pos: 'adj';
  comp?: string;
  sup?: string;
  ipa?: string;
}

/** Другая часть речи. */
export interface LexiconOtherEntry {
  pos?: 'adv' | 'other';
  ipa?: string;
}

/** Ссылка с формы слова на основную лемму: «geholt» → «holen». */
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

/** Метаданные базы в public/lex/de/meta.json. */
export interface LexiconMeta {
  version: string;
  lang: string;
  date: string;
  entries: number;
  sources: Array<{ name: string; url: string; license: string }>;
}

/** Префикс файла (первые 2 буквы в нижнем регистре, умлауты сохраняются). */
export function getLexiconPrefix(word: string): string {
  const clean = word.trim().toLowerCase().replace(/[^a-zäöüß0-9]/gi, '');
  if (clean.length < 2) return 'other';
  return clean.slice(0, 2);
}

/** Проверка: является ли запись ссылкой на другую лемму. */
export function isLexiconRef(entry: LexiconEntry): entry is LexiconRefEntry {
  return typeof (entry as LexiconRefEntry).lemma === 'string';
}
