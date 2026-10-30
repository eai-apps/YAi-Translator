/**
 * Словарные данные (версия 0.5.0): карточка из настоящих словарей и полезные ресурсы.
 * Общие типы для сайта и Functions — подключаются через shared/types.ts.
 */
import type { LanguageCode, PartOfSpeech } from './types';

/* ------------------------- Словарные источники ------------------------- */

/** Источники карточки. Один файл = один источник в functions/_lib/dict/. */
export const DICT_SOURCE_IDS = ['wiktionary', 'openthesaurus', 'tatoeba', 'pons'] as const;
export type DictSourceId = (typeof DICT_SOURCE_IDS)[number];

export interface DictSourceRef {
  id: DictSourceId;
  /** Название для подписи: «Wiktionary». */
  name: string;
  /** Ссылка на статью или на сайт источника. */
  url: string;
}

/** Одно значение слова из словаря. */
export interface DictSense {
  source: DictSourceId;
  partOfSpeech: PartOfSpeech;
  /** Значение на исходном языке (как в словаре). */
  definition: string;
  /** Перевод из двуязычного словаря (PONS), если источник его даёт. */
  translation: string | null;
  /** Язык перевода (у Wiktionary значения на английском). */
  translationLang: LanguageCode | null;
}

/** Строка грамматической таблицы, например «Nominativ · Singular → Haus». */
export interface DictForm {
  /** Что это за форма: «Präteritum», «Plural», «Partizip II» … */
  label: string;
  value: string;
}

/** Пример из корпуса (Tatoeba) или из словаря. */
export interface DictExample {
  text: string;
  translation: string | null;
  /** Язык перевода, если он есть. */
  translationLang: LanguageCode | null;
  /** Кто дал пример: 'tatoeba' или 'wiktionary'. */
  source: DictSourceId;
  /** Ссылка на предложение или статью. */
  url: string;
}

/** Толкование слова на немецком (Deutsches Wörterbuch). */
export interface DictDefinition {
  text: string;
  partOfSpeech: PartOfSpeech;
  /** Ссылка на статью в источнике. */
  url: string;
}

export interface DictEntry {
  word: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  /** Какие источники ответили (внизу карточки — «Источники: …»). */
  sources: DictSourceRef[];
  senses: DictSense[];
  /** Артикль существительного (der/die/das), null — не существительное. */
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
  /** Часть речи по данным словаря. */
  partOfSpeech: PartOfSpeech | null;
  /** Транскрипция [haʊ̯s] из Wiktionary. */
  transcription: string | null;
  forms: DictForm[];
  synonyms: string[];
  examples: DictExample[];
  /** Значение на немецком — для немецкого слова. */
  definitions: DictDefinition[];
}

export interface DictRequest {
  word: string;
  sourceLang: LanguageCode | 'auto';
  targetLang: LanguageCode;
}

/** Ответ /api/dict. */
export interface DictResponse {
  entry: DictEntry;
  /** true — данные взяты из кэша D1. */
  cached: boolean;
}

/* ----------------------------- Ресурсы ----------------------------- */

/** Группы полезных ресурсов. */
export const RESOURCE_CATEGORIES = [
  'dictionaries',
  'grammar',
  'listening',
  'exams',
  'life',
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export function isResourceCategory(value: unknown): value is ResourceCategory {
  return typeof value === 'string' && (RESOURCE_CATEGORIES as readonly string[]).includes(value);
}

export interface ResourceItem {
  id: number;
  lang: LanguageCode;
  category: ResourceCategory;
  title: string;
  url: string;
  descriptionRu: string;
  descriptionDe: string;
  descriptionEn: string;
  sort: number;
  /** Скрыта со страницы «Ресурсы» (админка видит все ссылки). */
  hidden: boolean;
}

/** Ответ /api/resources: только видимые ссылки, рядом с языком интерфейса — первым. */
export interface ResourcesResponse {
  items: ResourceItem[];
  /** Языки, для которых есть ресурсы (в порядке списка языков). */
  langs: LanguageCode[];
}

/** Действия админа с ресурсами. */
export type ResourceAction = 'add' | 'update' | 'delete' | 'hide' | 'show' | 'move';

export interface AdminResourcesResponse {
  /** Показывать ресурсы в приложениях из магазинов (App Store / Google Play). */
  showInApps: boolean;
  items: ResourceItem[];
}

export interface ResourceInput {
  lang: LanguageCode;
  category: ResourceCategory;
  title: string;
  url: string;
  descriptionRu: string;
  descriptionDe: string;
  descriptionEn: string;
  hidden?: boolean;
}
