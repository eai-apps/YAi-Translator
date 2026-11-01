/**
 * Интерактивный мини-тест по теме грамматики (этап 18, версия 0.20.0).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GrammarQuizQuestion } from '../../../shared/types';
import { Button } from '../ui/Button';
import { SectionTitle } from '../ui/SectionTitle';
import { IconCheck, IconClose } from '../layout/icons';

interface GrammarQuizProps {
  quiz: GrammarQuizQuestion[];
}

export function GrammarQuiz({ quiz }: GrammarQuizProps) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, number>>({});

  if (!quiz || quiz.length === 0) return null;

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (answers[qIndex] !== undefined) return; // уже отвечено
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const resetQuiz = () => {
    setAnswers({});
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(([qIdx, optIdx]) => {
    const q = quiz[Number(qIdx)];
    return q && q.answerIndex === optIdx;
  }).length;

  return (
    <section className="mt-6 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <SectionTitle>{t('grammar.quizTitle', 'Мини-тест по теме')}</SectionTitle>
          <p className="text-xs text-muted mt-0.5">
            {t('grammar.quizSubtitle', 'Проверьте понимание правила: ответьте на 5 вопросов')}
          </p>
        </div>
        {answeredCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-soft text-ink">
              {correctCount} / {quiz.length}
            </span>
            <Button size="sm" variant="ghost" onClick={resetQuiz}>
              {t('grammar.quizReset', 'Заново')}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {quiz.map((item, qIndex) => {
          const selected = answers[qIndex];
          const isAnswered = selected !== undefined;
          const isCorrect = selected === item.answerIndex;

          return (
            <div key={qIndex} className="rounded-xl border border-line p-3 sm:p-4 bg-card">
              <p className="text-sm font-medium leading-relaxed text-ink mb-2.5">
                <span className="text-muted mr-1.5">{qIndex + 1}.</span>
                {item.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.options.map((opt, optIndex) => {
                  let btnStyle = 'border border-line bg-card hover:bg-soft text-ink';
                  let icon = null;

                  if (isAnswered) {
                    if (optIndex === item.answerIndex) {
                      btnStyle = 'border border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-medium';
                      icon = <IconCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
                    } else if (selected === optIndex) {
                      btnStyle = 'border border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200';
                      icon = <IconClose className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />;
                    } else {
                      btnStyle = 'border border-line bg-soft/50 text-muted opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIndex}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelect(qIndex, optIndex)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm rounded-lg text-left transition-colors ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {isAnswered ? (
                <div className={`mt-2.5 p-2.5 rounded-lg text-xs leading-relaxed ${
                  isCorrect
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                }`}>
                  <p className="font-semibold mb-0.5">
                    {isCorrect ? t('grammar.quizCorrect', '✓ Правильно!') : t('grammar.quizIncorrect', '✗ Не совсем так')}
                  </p>
                  <p>{item.explanation}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
