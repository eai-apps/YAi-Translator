/**
 * Вкладка «Учёба» (этап 6): серия и цель дня, повторение, слово дня,
 * упражнения, карточки, наборы и статистика за неделю.
 * Справочник грамматики (этап 5) остаётся здесь же — на телефоне вкладок только пять.
 */
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StudyRing } from '../components/study/StudyRing';
import { StudyTile } from '../components/study/StudyTile';
import { WeekChart } from '../components/study/WeekChart';
import { WordOfDayCard } from '../components/study/WordOfDayCard';
import { useStudy } from '../hooks/useStudy';
import { lastDays, pickSession } from '../lib/srs';
import { IconBook, IconBookmark, IconGrammar, IconSparkles } from '../components/layout/icons';

interface LearnPageProps {
  /** Показывает плитку справочника грамматики (этап 5). */
  withGrammarLink?: boolean;
}

export default function LearnPage({ withGrammarLink = false }: LearnPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cards, progress, days, goal, newPerDay, today, streak, setGoal } = useStudy();

  // Сколько карточек попадёт в сессию: сначала просроченные, затем новые.
  const sessionSize = useMemo(
    () => pickSession(cards, progress, { newPerDay }).length,
    [cards, progress, newPerDay],
  );
  const week = useMemo(() => lastDays(days, 7), [days]);
  const canReview = sessionSize > 0;

  return (
    <>
      <PageHeader title={t('study.title')} subtitle={t('study.subtitle')} />

      <div className="space-y-3">
        <StudyRing reviews={today.reviews} goal={goal} streak={streak} onGoalChange={setGoal} />

        <Button
          variant="primary"
          size="md"
          className="w-full"
          disabled={!canReview}
          onClick={() => navigate('/learn/review')}
        >
          {canReview ? t('study.reviewCount', { count: sessionSize }) : t('study.reviewEmpty')}
        </Button>
        {!canReview ? (
          <p className="text-center text-xs text-muted">{t('study.reviewEmptyText')}</p>
        ) : null}

        <WordOfDayCard />

        <div className="grid gap-3 sm:grid-cols-2">
          <StudyTile
            to="/learn/practice/article"
            icon={<IconSparkles className="h-5 w-5" />}
            title={t('study.tilePractice')}
            hint={t('study.tilePracticeHint')}
          />
          <StudyTile
            to="/learn/cards"
            icon={<IconBookmark className="h-5 w-5" />}
            title={t('study.tileCards', { count: cards.length })}
            hint={t('study.tileCardsHint')}
          />
          <StudyTile
            to="/learn/decks"
            icon={<IconBook className="h-5 w-5" />}
            title={t('study.tileDecks')}
            hint={t('study.tileDecksHint')}
          />
          {withGrammarLink ? (
            <StudyTile
              to="/grammar"
              icon={<IconGrammar className="h-5 w-5" />}
              title={t('study.tileGrammar')}
              hint={t('study.tileGrammarHint')}
            />
          ) : null}
        </div>

        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t('study.weekTitle')}</h2>
            <Link to="/learn/cards" className="text-xs font-medium text-accent hover:underline">
              {t('study.tileCards', { count: cards.length })}
            </Link>
          </div>
          <WeekChart days={week} />
        </Card>
      </div>
    </>
  );
}
