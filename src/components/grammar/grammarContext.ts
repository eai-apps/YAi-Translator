/**
 * Общее состояние справочника грамматики (версия 0.6.0).
 * GrammarOpenContext — открыть тему всплывающим окном с любой страницы;
 * GrammarContext — список тем и тот же обработчик открытия (для страницы /grammar).
 */
import { createContext } from 'react';
import type { GrammarTopicSummary } from '../../../shared/types';
export interface GrammarContextValue {
  /** Темы справочника (без текста). */
  topics: GrammarTopicSummary[];
  /** Показать тему во всплывающем окне. */
  openTopic: (slug: string) => void;
}

export const GrammarContext = createContext<GrammarContextValue>({
  topics: [],
  openTopic: () => undefined,
});

export interface GrammarOpenValue {
  open: (slug: string) => void;
}

export const GrammarOpenContext = createContext<GrammarOpenValue>({ open: () => undefined });
