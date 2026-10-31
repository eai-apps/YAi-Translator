/**
 * Карточка слова и разбор грамматики (версия 0.6.0). Выделено из shared/types.ts.
 * «Спросить у AI» и справочник грамматики — в shared/grammar.ts.
 */
import type { LanguageCode, UiLanguage } from './languages';
import type { DictSourceRef } from './dict';
import type { CefrLevel, GrammaticalCase, SourceLanguage } from './typeCore';
import type { PartOfSpeech, ProviderId } from './typeTasks';

/* ------------------------------ Карточка слова ------------------------------ */

export interface WordRequest {
  word: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
}

export interface WordMeaning {
  /** Оттенок смысла на языке интерфейса (например, «действие»). */
  sense: string;
  translations: string[];
  note: string | null;
}

export interface DeclensionRow {
  grammaticalCase: GrammaticalCase;
  singular: string;
  plural: string;
}

export interface VerbForm {
  pronoun: string;
  form: string;
}

export interface Conjugation {
  praesens: VerbForm[];
  praeteritum: VerbForm[];
  /** Готовая форма Perfekt, например «hat gemacht». */
  perfekt: string;
  auxiliary: 'haben' | 'sein';
}

export interface WordExample {
  level: CefrLevel;
  text: string;
  translation: string;
}

export interface Phrase {
  text: string;
  translation: string;
}

export interface WordCard {
  /** Слово в исходной форме (лемма). */
  lemma: string;
  /** Язык, к которому относится карточка. */
  language: LanguageCode;
  partOfSpeech: PartOfSpeech;
  article: 'der' | 'die' | 'das' | null;
  plural: string | null;
  transcription: string | null;
  meanings: WordMeaning[];
  /** Склонение по 4 падежам (для существительных и прилагательных). */
  declension: DeclensionRow[] | null;
  /** Спряжение (только для глаголов). */
  conjugation: Conjugation | null;
  /** Управление предлогами и падежами, например «warten auf + Akk.». */
  governance: string[];
  examples: WordExample[];
  synonyms: string[];
  antonyms: string[];
  phrases: Phrase[];
  /**
   * Грамматические пояснения на языке интерфейса: возвратный ли глагол, отделяемая ли приставка,
   * почему слова пишутся/стоят вместе, какой союз или предлог требуется.
   */
  grammarNotes: string[];
  /**
   * Источники, по которым дополнена карточка (этап 4: OpenThesaurus, Tatoeba, PONS).
   * Пусто — карточка только от ИИ.
   */
  dictSources?: DictSourceRef[];
  /** Slug тем справочника грамматики для пояснений (этап 5). */
  grammarTopics?: string[];
}

export interface WordResponse {
  card: WordCard;
  provider: ProviderId;
  cached: boolean;
}

/* ---------------------------- Разбор грамматики ---------------------------- */

export interface ExplainRequest {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  uiLang: UiLanguage;
}

export interface ConjunctionNote {
  conjunction: string;
  meaning: string;
  alternatives: string[];
}

export interface CaseNote {
  grammaticalCase: string;
  usage: string;
  example: string;
}

export interface TenseNote {
  tense: string;
  usage: string;
  example: string;
}

export interface MistakeNote {
  wrong: string;
  right: string;
  explanation: string;
}

export interface VocabularyNote {
  word: string;
  translation: string;
  note: string;
}

export interface ExplainResponse {
  summary: string;
  wordOrder: string[];
  conjunctions: ConjunctionNote[];
  cases: CaseNote[];
  tenses: TenseNote[];
  commonMistakes: MistakeNote[];
  vocabulary: VocabularyNote[];
  /**
   * Slug тем справочника грамматики, к которым относится разбор (этап 5).
   * Из них на экране появляются ссылки-термины; список проверен на сервере.
   */
  topics: string[];
  provider: ProviderId;
  cached: boolean;
}

/* ------------------------- Проверка немецкого текста ------------------------ */

export interface CheckRequest {
  text: string;
  uiLang: UiLanguage;
}

export type CorrectionType =
  | 'grammar'
  | 'spelling'
  | 'word-order'
  | 'vocabulary'
  | 'punctuation'
  | 'style';

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: CorrectionType;
}

export interface CheckResponse {
  correctedText: string;
  isCorrect: boolean;
  corrections: Correction[];
  encouragement: string;
  provider: ProviderId;
  cached: boolean;
}
