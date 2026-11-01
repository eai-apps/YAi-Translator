/**
 * Сессия повторения карточек (этап 6, этап 13).
 * Понятный интерфейс:
 * - Крупно слово с артиклем.
 * - Кнопка «Показать».
 * - 3 крупные кнопки снизу: «Не помню / Трудно / Легко» (удобно большим пальцем).
 * - Свайп влево = «Не помню», свайп вправо = «Легко».
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { StudyGrade } from '../../../shared/types';
import { cn } from '../../lib/cn';
import { pickSession } from '../../lib/srs';
import type { SessionEntry } from '../../lib/srs';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { useStudyPing } from '../../hooks/useStudyPing';
import { useSwipe } from '../../hooks/useSwipe';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { ReviewCard } from '../../components/study/ReviewCard';
import { IconCheck, IconClose, IconStar } from '../../components/layout/icons';

type Direction = 'de-ru' | 'ru-de';

export default function ReviewPage() {
  const { t } = useTranslation();
  const { cards, progress, lists, newPerDay, grade, getProgress } = useStudy();
  const ping = useStudyPing();
  const speech = useSpeech();

  // «Учить этот список» (этап 8Б): ?list=<id> — повторяем только слова своего списка.
  const [params] = useSearchParams();
  const listId = params.get('list');
  const sessionCards = useMemo(() => {
    const list = listId ? lists.find((item) => item.id === listId) : null;
    if (!list) return cards;
    const inside = new Set(list.cardIds);
    return cards.filter((card) => inside.has(card.id));
  }, [cards, lists, listId]);

  const [direction, setDirection] = useState<Direction>('de-ru');
  const [queue, setQueue] = useState<SessionEntry[]>(() => pickSession(sessionCards, progress, { newPerDay }));
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const repeated = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;
  const total = done + queue.length;
  const finished = queue.length === 0;
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
      // «Не помню» — карточка снова в конце сессии, но не более одного раза
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
    setQueue(pickSession(sessionCards, progress, { newPerDay }));
  };

  // Жест свайпа по карточке: влево = «Не помню», вправо = «Легко»
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const { dragOffset, isDragging } = useSwipe(cardContainerRef, {
    onSwipeLeft: () => {
      if (current) answer('again');
    },
    onSwipeRight: () => {
      if (current) answer('easy');
    },
  });

  const card = current?.card ?? null;

  if (!card) {
    return (
      <>
        <PageHeader title={t('study.reviewTitle')} subtitle={t('study.subtitle')} />
        <Card className="mx-auto max-w-md p-6 text-center">
          {started ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                <IconCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold">{t('study.reviewDoneTitle')}</h2>
              <p className="mt-1 text-sm text-muted">{t('study.reviewDoneText', { n: done })}</p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <Button variant="primary" size="md" onClick={restart}>
                  {t('study.reviewAgainSession')}
                </Button>
                <Link
                  to="/learn"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-5 text-sm font-semibold text-ink hover:bg-soft"
                >
                  {t('study.reviewToStudy')}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">{t('study.allDoneForToday')}</p>
              <p className="mt-1 text-sm text-muted">{t('study.reviewEmptyText')}</p>
              <Link
                to="/learn/decks"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-accentInk shadow-sm"
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

      <div className="mx-auto max-w-xl space-y-4">
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
          <span className="text-xs font-semibold tabular-nums text-muted">
            {t('study.reviewProgress', { done: done + 1, total: Math.max(total, 1) })}
          </span>
        </div>

        {/* Контейнер карточки со свайпом */}
        <div
          ref={cardContainerRef}
          className="relative transition-transform"
          style={
            isDragging
              ? {
                  transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.04}deg)`,
                  transition: 'none',
                }
              : undefined
          }
        >
          <ReviewCard
            card={card}
            germanSide={germanSide}
            flipped={flipped}
            onFlip={() => setFlipped((value) => !value)}
            speech={speech}
          />
        </div>

        {/* Кнопка «Показать» или 3 крупные кнопки ответа */}
        {flipped ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* 1. Не помню */}
              <button
                type="button"
                onClick={() => answer('again')}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border font-bold text-sm transition-all shadow-sm',
                  'border-red-500/30 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 active:scale-95',
                )}
              >
                <IconClose className="h-4 w-4" />
                <span>{t('study.reviewAgain')}</span>
              </button>

              {/* 2. Трудно */}
              <button
                type="button"
                onClick={() => answer('hard')}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border font-bold text-sm transition-all shadow-sm',
                  'border-line bg-card text-ink hover:bg-soft active:scale-95',
                )}
              >
                <span className="text-xs">⚡</span>
                <span>{t('study.reviewHard')}</span>
              </button>

              {/* 3. Легко */}
              <button
                type="button"
                onClick={() => answer('easy')}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border font-bold text-sm transition-all shadow-sm',
                  'border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 active:scale-95',
                )}
              >
                <IconStar className="h-4 w-4" />
                <span>{t('study.reviewEasy')}</span>
              </button>
            </div>
            <p className="text-center text-[11px] text-muted">
              {t('study.swipeHint')}
            </p>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full h-14 text-base font-semibold shadow-md rounded-2xl"
            onClick={() => setFlipped(true)}
          >
            {t('study.showAnswer')}
          </Button>
        )}
      </div>
    </>
  );
}
