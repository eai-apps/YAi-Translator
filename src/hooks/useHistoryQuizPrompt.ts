/**
 * Хук для отслеживания момента предложения теста «Повтори 5 слов из истории».
 * Срабатывает после каждых 10 переводов отдельных слов (kind === 'word').
 * Можно отключить в настройках (quizEnabled).
 */
import { useCallback, useState } from 'react';
import type { HistoryItem } from './useHistory';
import { readStorage, writeStorage } from '../lib/storage';

const WORD_COUNT_KEY = 'yai.wordTranslateCount';
const DISMISSED_MILESTONE_KEY = 'yai.wordQuizDismissed';

export function useHistoryQuizPrompt(items: HistoryItem[], enabled: boolean) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Считаем доступные слова из истории
  const wordItems = items.filter((it) => it.kind === 'word');
  const count = readStorage<number>(WORD_COUNT_KEY, 0);
  const milestone = Math.floor(count / 10);
  const lastDismissed = readStorage<number>(DISMISSED_MILESTONE_KEY, 0);

  const shouldPrompt =
    enabled &&
    !dismissed &&
    count >= 10 &&
    milestone > lastDismissed &&
    wordItems.length >= 4;

  const onWordTranslated = useCallback(() => {
    const current = readStorage<number>(WORD_COUNT_KEY, 0);
    const updated = current + 1;
    writeStorage(WORD_COUNT_KEY, updated);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    writeStorage(DISMISSED_MILESTONE_KEY, milestone);
  }, [milestone]);

  const startQuiz = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeQuiz = useCallback(() => {
    setModalOpen(false);
    dismiss();
  }, [dismiss]);

  return {
    shouldPrompt,
    modalOpen,
    wordItems,
    onWordTranslated,
    dismiss,
    startQuiz,
    closeQuiz,
  };
}
