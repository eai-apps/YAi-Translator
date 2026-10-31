/**
 * «Спросить у AI»: вопрос учителю и ответ на языке интерфейса (версия 0.6.0).
 * Каждый вопрос сохраняется в историю; ответ приходит с сервера, где он кэшируется
 * на 90 дней, поэтому повтор того же вопроса ИИ не тратит.
 */
import { useCallback, useRef, useState } from 'react';
import type { AskResponse, UiLanguage } from '../../shared/types';
import { api } from '../api/client';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';
import { useAskHistory } from './useAskHistory';

export interface AskState {
  loading: boolean;
  answer: AskResponse | null;
  error: TranslatorError | null;
  /** Вопрос, на который сейчас показан ответ. */
  shownQuestion: string | null;
}

export function useAsk(uiLanguage: UiLanguage) {
  const history = useAskHistory();
  const [state, setState] = useState<AskState>({ loading: false, answer: null, error: null, shownQuestion: null });
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (raw: string) => {
      const question = raw.replace(/\s+/g, ' ').trim();
      if (question.length < 3) return;

      // Уже спрашивали — показываем сохранённый ответ, не тратя лимит.
      const known = history.items.find((item) => item.question.toLowerCase() === question.toLowerCase());
      if (known?.answer) {
        setState({ loading: false, answer: known.answer, error: null, shownQuestion: known.question });
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ loading: true, answer: null, error: null, shownQuestion: question });

      try {
        const answer = await api.ask({ question, uiLang: uiLanguage }, controller.signal);
        if (controller.signal.aborted) return;
        setState({ loading: false, answer, error: null, shownQuestion: question });
        history.add(question, uiLanguage, answer);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setState({ loading: false, answer: null, error: toTranslatorError(caught, 'ask.error'), shownQuestion: question });
      }
    },
    [history, uiLanguage],
  );

  /** Открыть вопрос из истории: ответ уже сохранён на устройстве. */
  const show = useCallback((item: { question: string; answer: AskResponse | null }) => {
    abortRef.current?.abort();
    if (item.answer) {
      setState({ loading: false, answer: item.answer, error: null, shownQuestion: item.question });
    } else {
      setState({ loading: false, answer: null, error: null, shownQuestion: item.question });
    }
  }, []);

  return { ...state, submit, show, history };
}
