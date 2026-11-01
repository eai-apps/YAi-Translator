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
  /** Уже полученный обычный перевод для поиска единой карточки обратного направления. */
  translation?: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  /** Нейросеть сайта: «id|модель» или «default» (ИИ Pro). */
  aiModel?: string;
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

/** Imperativ: три формы — du, ihr, Sie (этап 8). */
export interface Imperative {
  du: string;
  ihr: string;
  sie: string;
}

export interface Conjugation {
  praesens: VerbForm[];
  praeteritum: VerbForm[];
  /** Готовая форма Perfekt, например «hat gemacht». */
  perfekt: string;
  auxiliary: 'haben' | 'sein';
  /** Partizip II одним словом («gemacht») — из него строятся Perfekt, Plusquamperfekt, Futur II. */
  partizip2?: string | null;
  /** Konjunktiv II, 6 форм в том же порядке, что и Präsens. */
  konjunktiv2?: VerbForm[];
  /** Imperativ du / ihr / Sie. */
  imperativ?: Imperative | null;
}

/** Что подсветить в примере: точные куски предложения и перевода (этап 8). */
export interface ExampleMatch {
  /** Форма слова, как она стоит в немецком предложении. */
  source: string;
  /** Перевод этой формы в переводе предложения. */
  target: string;
}

export interface WordExample {
  level: CefrLevel;
  text: string;
  translation: string;
  /** Подсветка слова в предложении и в переводе; без неё пример показывается как есть. */
  match?: ExampleMatch | null;
  /** Номер значения (с 1), к которому относится пример — для фильтра «все / значение». */
  sense?: number | null;
}

export interface Phrase {
  text: string;
  translation: string;
}

/** «То же самое другими словами» (этап 8Б): пара предложений с переводом. */
export interface Paraphrase {
  text: string;
  translation: string;
}

/** Пример внутри пункта грамматики (этап 8Б): уровень A1–B2, предложение и перевод. */
export interface WordGrammarExample {
  level: CefrLevel;
  text: string;
  translation: string;
}

/** Подробный пункт грамматики по этому слову (этап 8Б): тема, объяснение и примеры. */
export interface GrammarPoint {
  title: string;
  /** Объяснение на языке интерфейса; названия тем вроде Akkusativ остаются текстом. */
  explanation: string;
  examples: WordGrammarExample[];
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
  /** Однокоренные слова: abholen, nachholen, die Abholung (этап 8). */
  family?: string[];
  phrases: Phrase[];
  /** «Как ещё сказать»: 3–4 пары «то же другими словами» (этап 8Б). */
  paraphrases?: Paraphrase[];
  /**
   * Переводы связанных слов на язык цели: «bringen» → «приносить» (этап 8Б).
   * Только для слов из synonyms / antonyms / family; для остальных перевода нет.
   */
  glossary?: Record<string, string>;
  /** Подробная грамматика с примерами A1–B2 (этап 8Б). Без неё показывается grammarNotes. */
  grammar?: GrammarPoint[];
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
  /** Человеческое произношение Wikimedia Commons (этап 15). */
  audioUrl?: string | null;
  /** Примерный уровень владения по частоте (этап 15): A1, A2, B1, B2, C1+. */
  cefrLevel?: CefrLevel | null;
  /** Ранг частотности слова (этап 15). */
  frequencyRank?: number | null;
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

/* ------------------------- Проверка текста (LanguageTool) ------------------------ */

export interface CheckRequest {
  text: string;
  uiLang: UiLanguage;
  lang?: string;
  sourceLang?: SourceLanguage;
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
  offset?: number;
  length?: number;
  replacements?: string[];
}

export interface CheckResponse {
  /** false — сервис не ответил; отсутствие исправлений не означает успешную проверку. */
  available?: boolean;
  correctedText: string;
  isCorrect: boolean;
  corrections: Correction[];
  encouragement: string;
  provider: ProviderId;
  cached: boolean;
}
