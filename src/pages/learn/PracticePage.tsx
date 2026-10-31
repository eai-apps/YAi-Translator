/**
 * Упражнения (этап 6): 10 вопросов из уже сохранённых карточек, без ИИ.
 * Виды: артикль, множественное число, перевод, аудирование, сборка предложения.
 * Ответ засчитывается как оценка «Помню» или «Не помню»; в статистику дня
 * упражнение попадает отдельным счётчиком — одним на сессию.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PRACTICE_TYPES, isPracticeType } from '../../../shared/study';
import type { PracticeType } from '../../../shared/types';
import { buildPractice, PRACTICE_QUESTION_COUNT } from '../../lib/practice';
import type { PracticeData } from '../../lib/practice';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { useStudyPing } from '../../hooks/useStudyPing';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PracticeQuestionView } from '../../components/study/PracticeQuestionView';
import { IconCheck, IconSparkles } from '../../components/layout/icons';

/** Заголовок вида упражнения: study.practiceArticle, study.practicePlural … */
function titleKey(type: PracticeType): string {
  return `study.practice${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

/** Пауза перед следующим вопросом: видно, что ответ засчитан. */
const NEXT_QUESTION_MS = 350;

export default function PracticePage() {
  const params = useParams();
  const type = params.type ?? '';
  if (!isPracticeType(type)) return <Navigate to="/learn/practice/article" replace />;
  return <PracticeSession key={type} type={type} />;
}

function PracticeSession({ type }: { type: PracticeType }) {
  const { t } = useTranslation();
  const { cards, recordExercise } = useStudy();
  const speech = useSpeech();
  const ping = useStudyPing();

  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);

  // Вопросы собираются заново при смене вида, карточек или по кнопке «Ещё раз».
  const data = useMemo<PracticeData>(() => buildPractice(type, cards), [type, cards, round]);
  const total = data.questions.length;
  const question = data.questions[index] ?? null;
  const finished = total > 0 && index >= total;

  // Ответ на последний вопрос закончен — отправляем счётчик упражнений один раз.
  useEffect(() => {
    if (finished) ping.flush();
  }, [finished, ping]);

  const answer = (right: boolean) => {
    if (answered || !question) return;
    setAnswered(true);
    recordExercise(question.card.id, right);
    ping.count('exercises');
    if (right) setCorrect((value) => value + 1);

    window.setTimeout(() => {
      setAnswered(false);
      setIndex((value) => value + 1);
    }, NEXT_QUESTION_MS);
  };

  const restart = () => {
    setRound((value) => value + 1);
    setIndex(0);
    setCorrect(0);
    setAnswered(false);
  };

  if (data.missing > 0) {
    return (
      <>
        <PageHeader title={t(titleKey(type))} subtitle={t('study.practiceSubtitle')} />
        <Card className="mx-auto max-w-md p-6 text-center">
          <p className="font-medium">{t('study.practiceNeedMore', { n: data.missing })}</p>
          <p className="mt-1 text-sm text-muted">{t('study.practiceNeedMoreText')}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/learn/decks"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-accentInk"
            >
              {t('study.tileDecks')}
            </Link>
            <Link
              to="/learn/cards"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-soft"
            >
              {t('study.cardsMy')}
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (finished || !question) {
    return (
      <>
        <PageHeader title={t('study.practiceTitle')} subtitle={t('study.practiceSubtitle')} />
        <Card className="mx-auto max-w-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
            <IconCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-semibold">{t('study.practiceDone', { correct, total })}</h2>
          <p className="mt-1 text-sm text-muted">{t('study.practiceDoneText')}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="primary" onClick={restart}>
              {t('study.practiceAgain')}
            </Button>
            <Link
              to="/learn"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-soft"
            >
              {t('study.reviewToStudy')}
            </Link>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t(titleKey(type))} subtitle={t('study.practiceSubtitle')} />
      <div className="mx-auto max-w-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Выбор вида упражнения: остальные виды открываются той же страницей. */}
          <div className="flex flex-wrap gap-1">
            {PRACTICE_TYPES.map((item) => (
              <Link
                key={item}
                to={`/learn/practice/${item}`}
                className={
                  item === type
                    ? 'rounded-lg bg-accentSoft px-2.5 py-1 text-xs font-medium text-accent'
                    : 'rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-soft hover:text-ink'
                }
              >
                {t(titleKey(item))}
              </Link>
            ))}
          </div>
          <span className="text-xs tabular-nums text-muted">
            {t('study.practiceProgress', { done: index + 1, total: PRACTICE_QUESTION_COUNT })}
          </span>
        </div>

        <Card className="p-4 sm:p-5">
          <p className="mb-3 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <IconSparkles className="h-3.5 w-3.5" />
            {t('study.practiceQuestion')}
          </p>
          <PracticeQuestionView
            key={`${round}-${index}-${type}`}
            question={question}
            speech={speech}
            onAnswer={answer}
          />
        </Card>
      </div>
    </>
  );
}
