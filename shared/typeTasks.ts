/**
 * Задачи и провайдеры ИИ (версия 0.6.0): от них зависят все запросы.
 * Файл выделен из shared/types.ts, чтобы тот не рос; импорт — по-прежнему из shared/types.
 */
import type { SourceLanguage } from './typeCore';

/** Тип задачи — входит в ключ кэша и определяет промпт. */
/** 'dict' и 'resources' — данные без ИИ (этап 4), тоже живут в таблице кэша D1. */
/** 'grammar' и 'ask' — справочник грамматики и «Спросить у AI» (этап 5); 'ask' кэшируется на 90 дней. */
/** 'study' — слово дня (этап 6): данные без ИИ, живут в таблице кэша D1 до конца дня. */
export type TaskKind = 'translate' | 'word' | 'explain' | 'check' | 'dict' | 'resources' | 'grammar' | 'ask' | 'study';

/** Провайдер ИИ, который реально ответил. */
/** ИИ: gemini, groq, workersai, paid. Обычные переводчики: deepl, lara, microsoft, google, mymemory, m2m100. */
export type ProviderId =
  | 'gemini'
  | 'groq'
  | 'deepl'
  | 'lara'
  | 'workersai'
  | 'microsoft'
  | 'google'
  | 'mymemory'
  | 'lingva'
  | 'apertium'
  | 'm2m100'
  | 'languagetool'
  | 'paid'
  | 'dict';

/** Часть речи для карточки слова. */
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'numeral'
  | 'interjection'
  | 'phrase'
  | 'other';

/** Переводчики, которые пользователь может выбрать вручную. Порядок = приоритет в цепочке. */
export const CLASSIC_PROVIDERS = ['deepl', 'lara', 'microsoft', 'google', 'mymemory', 'lingva', 'apertium', 'm2m100'] as const;
export type ClassicProviderId = (typeof CLASSIC_PROVIDERS)[number];

export type { SourceLanguage };
