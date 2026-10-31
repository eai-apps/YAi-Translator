/** Доступ к справочнику с любой страницы (версия 0.6.0): открыть тему и прочитать список тем. */
import { useContext } from 'react';
import { GrammarContext, GrammarOpenContext } from './grammarContext';

/** open(slug) — показать тему во всплывающем окне. */
export function useGrammar(): { open: (slug: string) => void } {
  return useContext(GrammarOpenContext);
}

/** Список тем и обработчик открытия (использует страница /grammar). */
export function useGrammarContext() {
  return useContext(GrammarContext);
}
