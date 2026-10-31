/**
 * Модальное окно быстрого теста на 5 слов из истории перевода.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HistoryItem } from '../../hooks/useHistory';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface HistoryQuizModalProps {
  open: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onComplete?: () => void;
}

interface QuizItem {
  id: string;
  question: string;
  correct: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function HistoryQuizModal({ open, onClose, items, onComplete }: HistoryQuizModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Генерируем 5 вопросов из переведённых слов
  const questions: QuizItem[] = useMemo(() => {
    if (!open) return [];
    const pool = items.filter((it) => it.text.trim() && it.translation.trim());
    const shuffledPool = shuffle(pool);
    const chosen = shuffledPool.slice(0, 5);

    return chosen.map((item) => {
      const distractors = pool
        .filter((it) => it.id !== item.id && it.translation !== item.translation)
        .map((it) => it.translation);
      const shuffledDistractors = shuffle(Array.from(new Set(distractors))).slice(0, 3);
      const options = shuffle([item.translation, ...shuffledDistractors]);
      return {
        id: item.id,
        question: item.text,
        correct: item.translation,
        options,
      };
    });
  }, [open, items]);

  const handleSelect = (option: string) => {
    if (selected !== null) return;
    setSelected(option);
    const isCorrect = option === questions[currentIndex].correct;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    } else {
      setFinished(true);
      onComplete?.();
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    onClose();
  };

  if (!open || questions.length === 0) return null;

  const current = questions[currentIndex];

  return (
    <Modal open={open} onClose={handleClose} title={t('translate.quizTitle')}>
      {finished ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-4xl">🎉</span>
          <h3 className="mt-3 text-lg font-bold">{t('translate.quizFinishedTitle')}</h3>
          <p className="mt-1 text-sm text-muted">
            {t('translate.quizScore', { score, total: questions.length })}
          </p>
          <Button size="md" variant="primary" className="mt-6 w-full" onClick={handleClose}>
            {t('common.done')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          {/* Индикатор прогресса */}
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{t('translate.quizProgress', { current: currentIndex + 1, total: questions.length })}</span>
            <span className="font-mono">{score} ★</span>
          </div>

          {/* Слово */}
          <div className="rounded-2xl border border-line bg-soft p-5 text-center">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">{t('translate.quizPromptWord')}</span>
            <p className="mt-1 text-2xl font-bold text-ink">{current.question}</p>
          </div>

          {/* Варианты ответов */}
          <div className="flex flex-col gap-2">
            {current.options.map((option) => {
              const isPicked = selected === option;
              const isCorrect = option === current.correct;
              let btnClass = 'border-line bg-card hover:bg-soft text-ink';
              if (selected !== null) {
                if (isCorrect) {
                  btnClass = 'border-success bg-success/15 text-success font-semibold';
                } else if (isPicked) {
                  btnClass = 'border-danger bg-danger/15 text-danger';
                } else {
                  btnClass = 'opacity-40 border-line bg-card';
                }
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all ${btnClass}`}
                >
                  <span>{option}</span>
                  {selected !== null && isCorrect ? <span>✓</span> : null}
                  {selected !== null && isPicked && !isCorrect ? <span>✕</span> : null}
                </button>
              );
            })}
          </div>

          {/* Кнопка "Далее" */}
          {selected !== null ? (
            <Button size="md" variant="primary" className="mt-2 w-full animate-fade-in" onClick={handleNext}>
              {currentIndex + 1 < questions.length ? t('common.next') : t('common.done')}
            </Button>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
