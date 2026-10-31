/**
 * Сессия повторения (этап 6): до 20 карточек, сначала просроченные, потом новые.
 * Лицо — немецкое слово с артиклем, оборот — перевод, множественное число и пример.
 * «Не помню» возвращает карточку в конец сессии (один раз за сессию).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { StudyGrade } from '../../../shared/types';
import { cn } from '../../lib/cn';
import { pickSession } from '../../lib/srs';
import type { SessionEntry } from '../../lib/srs';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { useStudyPing } from '../../hooks/useStudyPing';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { ReviewCard } from '../../components/study/ReviewCard';
import { IconBookmark, IconCheck, IconClose, IconStar } from '../../components/layout/icons';

type Direction = 'de-ru' | 'ru-de';

const GRADES: Array<{ grade: StudyGrade; key: string; className: string }> = [
  { grade: 'again', key: 'reviewAgain', className: 'border-danger/40 text-danger hover:bg-soft' },
  { grade: 'hard', key: 'reviewHard', className: 'border-line text-ink hover:bg-soft' },
  { grade: 'good', key: 'reviewGood', className: 'border-accent bg-accentSoft text-accent hover:brightness-105' },
  { grade: 'easy', key: 'reviewEasy', className: 'border-success/40 text-success hover:bg-soft' },
];

export default function ReviewPage() {
  const { t } = useTranslation();
  const { cards, progress, newPerDay, grade, getProgress } = useStudy();
  const ping = useStudyPing();
  const speech = useSpeech();

  const [direction, setDirection] = useState<Direction>('de-ru');
  const [queue, setQueue] = useState<SessionEntry[]>(() => pickSession(cards, progress, { newPerDay }));
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const repeated = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;
  const total = done + queue.length;
  const finished = queue.length === 0;
  // Сессия начата, если уже была хотя бы одна оценка: так пустой старт
  // показывается как «на сегодня всё», а не как «сессия закончена».
  const started = done > 0;

  // Итог сессии отправляем один раз, а не на каждую карточку.
  useEffect(() => {
    if (finished) ping.flush();
  }, [finished, ping]);

  const answer = (value: StudyGrade) => {
    if (!current) return;
    grade(current.card.id, value);
    ping.count('reviews');
    setDone((count) => count + 1);
    setFlipped(false);

    setQueue((previous) => {
      const rest = previous.slice(1);
      // «Не помню» — карточка снова в конце сессии, но не бесконечно.
      if (value === 'again' && !repeated.current.has(current.card.id)) {
        repeated.current.add(current.card.id);
        const refreshed = getProgress(current.card.id) ?? current.progress;
        return [...rest, { ...current, progress: refreshed, isNew: false }];
      }
      return rest;
    });
  };

  const restart = () => {
    repeated.current = new Set();
    setDone(0);
    setFlipped(false);
    setQueue(pickSession(cards, progress, { newPerDay }));
  };

  const card = current?.card ?? null;

  if (!card) {
    return (
      <>
        <PageHeader title={t('study.reviewTitle')} subtitle={t('study.subtitle')} />
        <Card className="mx-auto max-w-md p-6 text-center">
          {started ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <IconCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-3 text-lg font-semibold">{t('study.reviewDoneTitle')}</h2>
              <p className="mt-1 text-sm text-muted">{t('study.reviewDoneText', { n: done })}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="primary" onClick={restart}>
                  {t('study.reviewAgainSession')}
                </Button>
                <Link
                  to="/learn"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-soft"
                >
                  {t('study.reviewToStudy')}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium">{t('study.reviewEmpty')}</p>
              <p className="mt-1 text-sm text-muted">{t('study.reviewEmptyText')}</p>
              <Link
                to="/learn/decks"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-accentInk"
              >
                {t('study.tileDecks')}
              </Link>
            </>
          )}
        </Card>
      </>
    );
  }

  const germanSide = direction === 'de-ru';

  return (
    <>
      <PageHeader title={t('study.reviewTitle')} subtitle={t('study.subtitle')} />

      <div className="mx-auto max-w-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            ariaLabel={t('study.reviewDirection')}
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'de-ru', label: t('study.reviewDeRu') },
              { value: 'ru-de', label: t('study.reviewRuDe') },
            ]}
          />
          <span className="text-xs tabular-nums text-muted">
            {t('study.reviewProgress', { done: done + 1, total: Math.max(total, 1) })}
          </span>
        </div>

        <ReviewCard
          card={card}
          germanSide={germanSide}
          flipped={flipped}
          onFlip={() => setFlipped((value) => !value)}
          speech={speech}
        />

        {flipped ? (
          <div className="grid grid-cols-2 gap-2">
            {GRADES.map((item) => (
              <button
                key={item.grade}
                type="button"
                onClick={() => answer(item.grade)}
                className={cn(
                  'inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border bg-card text-sm font-medium transition-colors',
                  item.className,
                )}
              >
                {item.grade === 'again' ? <IconClose className="h-4 w-4" /> : null}
                {item.grade === 'hard' ? <IconBookmark className="h-4 w-4" /> : null}
                {item.grade === 'good' ? <IconCheck className="h-4 w-4" /> : null}
                {item.grade === 'easy' ? <IconStar className="h-4 w-4" /> : null}
                {t(`study.${item.key}`)}
              </button>
            ))}
          </div>
        ) : (
          <Button variant="primary" size="md" className="w-full" onClick={() => setFlipped(true)}>
            {t('study.reviewShowAnswer')}
          </Button>
        )}
      </div>
    </>
  );
}
