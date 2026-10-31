/**
 * Справочник грамматики и «Спросить у AI» (версия 0.6.0).
 * Общие типы для сайта и Functions — подключаются через shared/types.ts.
 */
import type { CefrLevel, LanguageCode, UiLanguage } from './types';
import type { GrammarCategory, GrammarLevel } from './grammarTopics';
import type { GrammarTopicLink } from './grammarLinks';

export type { GrammarCategory, GrammarLevel, GrammarTopicLink };
export { GRAMMAR_CATEGORIES, GRAMMAR_LEVELS } from './grammarTopics';

/** Один пример предложения в теме справочника. */
export interface GrammarExample {
  level: CefrLevel | 'C1';
  text: string;
  translation: string;
}

/** Правило образования формы: как строится и пример с переводом. */
export interface GrammarFormation {
  rule: string;
  example: string;
  translation: string;
}

/** Частая ошибка: как не надо, как надо и почему. */
export interface GrammarMistake {
  wrong: string;
  right: string;
  why: string;
}

/**
 * Содержание темы — тексты на языке интерфейса. Хранится в D1 (грамматика) или в кэше
 * (ответ «Спросить у AI»), поэтому общий тип подходит обоим.
 */
export interface GrammarBody {
  summary: string;
  whenToUse: string[];
  formation: GrammarFormation[];
  examples: GrammarExample[];
  exceptions: string[];
  commonMistakes: GrammarMistake[];
  /** Slug связанных тем — ссылки «Смотрите также». */
  related: string[];
  links: GrammarTopicLink[];
}

/** Тема в списке: без текста, только заголовок и служебные поля. */
export interface GrammarTopicSummary {
  slug: string;
  lang: LanguageCode;
  level: GrammarLevel;
  category: GrammarCategory;
  titleRu: string;
  titleDe: string;
  titleEn: string;
  /** true — текст уже сгенерирован ИИ или вписан в админке. */
  filled: boolean;
  updatedAt: number | null;
}

/** Ответ GET /api/grammar/topics. */
export interface GrammarTopicsResponse {
  items: GrammarTopicSummary[];
  /** Языки, для которых есть темы справочника (сейчас только немецкий). */
  langs: LanguageCode[];
}

/** Ответ GET /api/grammar/topic?slug=…&ui=… */
export interface GrammarTopicResponse extends GrammarTopicSummary {
  /** null — текста ещё нет: показываем кнопку «Повторить позже». */
  body: GrammarBody | null;
  /** 'ai' — тексты только что составлены ИИ; 'admin' — правка редактора; 'none' — пусто. */
  source: 'ai' | 'admin' | 'none';
  /** Понятная причина, если ИИ сейчас недоступен (на языке интерфейса). */
  offlineReason: 'limit' | 'error' | null;
  /** Ссылки на источники: есть всегда, даже без текста. */
  links: GrammarTopicLink[];
}

/* ------------------------------ «Спросить у AI» ------------------------------ */

export interface AskRequest {
  question: string;
  /** Язык ответа (по умолчанию — язык интерфейса). */
  uiLang?: UiLanguage;
}

/** Раздел ответа ИИ: заголовок + 1–3 абзаца. */
export interface AskSection {
  heading: string;
  text: string;
}

export interface AskResponse {
  summary: string;
  sections: AskSection[];
  examples: Array<{ text: string; translation: string }>;
  /** Slug тем справочника, на которые ссылается ответ. */
  topics: string[];
  provider: string;
  cached: boolean;
}

/* ------------------------------ Админка ------------------------------ */

export interface AdminGrammarTopic extends GrammarTopicSummary {
  body: GrammarBody | null;
  source: 'ai' | 'admin' | 'none';
  sourceUrl: string | null;
  editedBy: string | null;
}

export interface AdminGrammarResponse {
  items: AdminGrammarTopic[];
}

/** Поля темы, которые можно менять в админке. */
export interface AdminGrammarInput {
  slug: string;
  level: GrammarLevel;
  category: GrammarCategory;
  titleRu: string;
  titleDe: string;
  titleEn: string;
  body: GrammarBody;
}

export type AdminGrammarAction =
  | ({ action: 'add' } & AdminGrammarInput)
  | ({ action: 'update' } & AdminGrammarInput)
  | { action: 'regenerate' | 'delete'; slug: string };
