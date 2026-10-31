/**
 * Выбор из нескольких вариантов (этап 6): артикль, множественное число и перевод.
 * Артикль показывается своим цветом (der синий, die красный, das зелёный),
 * после ответа верный вариант становится зелёным, выбранный неверный — красным.
 */
import { useState } from 'react';
import type { StudyArticle } from '../../../shared/types';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import type { PracticeQuestion } from '../../lib/practice';

type AnswerState = 'idle' | 'correct' | 'wrong';

/** Цвет выбранного варианта: верный — зелёный, выбранный неверный — красный. */
export function optionState(option: string, answer: string, picked: string | null): AnswerState {
  if (!picked) return 'idle';
  if (option === answer) return 'correct';
  return option === picked ? 'wrong' : 'idle';
}

export function OptionButton({
  label,
  state,
  onClick,
  className,
}: {
  label: string;
  state: AnswerState;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[48px] items-center justify-center rounded-xl border bg-card px-3 text-sm font-medium transition-colors',
        state === 'correct' && 'border-success bg-soft text-success',
        state === 'wrong' && 'border-danger bg-soft text-danger',
        state === 'idle' && 'border-line text-ink hover:border-accent',
        className,
      )}
    >
      {label}
    </button>
  );
}

/** Слово крупным шрифтом по центру. */
export function WordLine({ word }: { word: string }) {
  return <p className="text-center text-xl font-semibold leading-snug">{word}</p>;
}

/** Артикль: «___ Tisch» → der / die / das. */
export function ArticleQuestion({
  question,
  onAnswer,
}: {
  question: Extract<PracticeQuestion, { type: 'article' }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<StudyArticle | null>(null);
  const choose = (value: StudyArticle) => {
    if (picked) return;
    setPicked(value);
    onAnswer(value === question.answer);
  };

  return (
    <div className="space-y-3">
      <WordLine word={`___ ${question.card.lemma}`} />
      <div className="grid grid-cols-3 gap-2">
        {question.options.map((option) => (
          <OptionButton
            key={option}
            label={option}
            state={optionState(option, question.answer, picked)}
            onClick={() => choose(option)}
            className={cn('text-base font-bold', picked ? undefined : ARTICLE_COLORS[option])}
          />
        ))}
      </div>
    </div>
  );
}

/** Множественное число и перевод: выбор из четырёх вариантов. */
export function ChoiceQuestion({
  question,
  onAnswer,
}: {
  question: Extract<PracticeQuestion, { type: 'plural' | 'translation' }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const word = question.card.article ? `${question.card.article} ${question.card.lemma}` : question.card.lemma;
  const choose = (value: string) => {
    if (picked) return;
    setPicked(value);
    onAnswer(value === question.answer);
  };

  return (
    <div className="space-y-3">
      <WordLine word={word} />
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <OptionButton
            key={option}
            label={option}
            state={optionState(option, question.answer, picked)}
            onClick={() => choose(option)}
          />
        ))}
      </div>
    </div>
  );
}
