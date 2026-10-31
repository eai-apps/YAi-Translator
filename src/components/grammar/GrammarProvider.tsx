/**
 * Граница справочника грамматики (версия 0.6.0).
 * Стоит один раз вокруг маршрутов (App.tsx): любая страница может открыть тему
 * всплывающим окном, не уходя со страницы перевода. Окно живёт здесь же.
 */
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GrammarTopicSummary } from '../../../shared/types';
import { GrammarTopicDialog } from './GrammarTopicDialog';
import { GrammarContext, GrammarOpenContext } from './grammarContext';
import { useGrammarPopupState } from './useGrammarPopupState';

interface GrammarProviderProps {
  children: ReactNode;
  /** Список тем: его грузит страница /grammar, окно тоже умеет попросить загрузку. */
  topics: {
    data: { items: GrammarTopicSummary[] } | null;
    loading: boolean;
    reload: () => void;
  };
  /** Язык интерфейса: на нём сервер составляет тексты тем. */
  uiLanguage: string;
}

export function GrammarProvider({ children, topics, uiLanguage }: GrammarProviderProps) {
  const navigate = useNavigate();
  const popup = useGrammarPopupState(topics, uiLanguage);
  const open = popup.open;

  const contextValue = useMemo(() => ({ topics: topics.data?.items ?? [], openTopic: open }), [topics.data, open]);
  const openValue = useMemo(() => ({ open }), [open]);

  return (
    <GrammarOpenContext.Provider value={openValue}>
      <GrammarContext.Provider value={contextValue}>
        {children}
        <GrammarTopicDialog
          open={popup.slug !== null}
          loading={popup.loading}
          data={popup.data}
          summary={popup.summary}
          error={popup.error}
          onClose={popup.close}
          onRetry={popup.retry}
          onOpenTopic={open}
          onOpenPage={(slug) => {
            popup.close();
            navigate(`/grammar/${slug}`);
          }}
          onAsk={(title) => {
            popup.close();
            navigate(`/ask?q=${encodeURIComponent(title)}`);
          }}
        />
      </GrammarContext.Provider>
    </GrammarOpenContext.Provider>
  );
}
