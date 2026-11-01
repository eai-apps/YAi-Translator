/**
 * Главный экран «Учёба» (этап 13).
 * Понятный интерфейс:
 * 1. Крупно: «Сегодня повторить: N слов» + кнопка «Начать» (или «На сегодня всё 🎉» + «Учить новые слова»).
 * 2. «Мои слова»: сколько всего, сколько выучено, полоска прогресса.
 * 3. Три понятные плитки: «Мои колоды», «Готовые наборы», «Тренировка».
 * 4. Первый вход (пустая учёба): пошаговая подсказка в 3 шага с иконками.
 */
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StudyTile } from '../components/study/StudyTile';
import { WeekChart } from '../components/study/WeekChart';
import { WordOfDayCard } from '../components/study/WordOfDayCard';
import { useStudy } from '../hooks/useStudy';
import { lastDays, pickSession } from '../lib/srs';
import {
  IconBookmark,
  IconClock,
  IconFlame,
  IconSparkles,
  IconStar,
  IconTranslate,
} from '../components/layout/icons';

interface LearnPageProps {
  withGrammarLink?: boolean;
}

export default function LearnPage({ withGrammarLink = false }: LearnPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cards, progress, days, newPerDay, streak, today, goal } = useStudy();

  // Карточки сессии на сегодня
  const sessionSize = useMemo(
    () => pickSession(cards, progress, { newPerDay }).length,
    [cards, progress, newPerDay],
  );

  // Выученные слова (интервал повторения >= 7 дней или >= 3 повторений)
  const learnedCount = useMemo(
    () => progress.filter((p) => p.interval >= 7 || p.reps >= 3).length,
    [progress],
  );
  const totalCards = cards.length;
  const learnedPercent = totalCards > 0 ? Math.min(100, Math.round((learnedCount / totalCards) * 100)) : 0;
  const week = useMemo(() => lastDays(days, 7), [days]);

  const isEmpty = totalCards === 0;

  return (
    <>
      <PageHeader title={t('study.title')} subtitle={t('study.subtitle')} />

      <div className="space-y-4">
        {/* 4. Первый вход: пошаговая подсказка в 3 шага */}
        {isEmpty ? (
          <Card className="overflow-hidden border-line bg-gradient-to-b from-accentSoft to-card p-5 sm:p-6">
            <h2 className="text-lg font-bold sm:text-xl">{t('study.onboardingTitle')}</h2>
            <ol className="my-4 space-y-2.5">
              <li className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent">
                  <IconTranslate className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">1. {t('study.onboardingStep1')}</p>
                  <p className="text-xs text-muted">{t('study.onboardingStep1Desc')}</p>
                </div>
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent">
                  <IconBookmark className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">2. {t('study.onboardingStep2')}</p>
                  <p className="text-xs text-muted">{t('study.onboardingStep2Desc')}</p>
                </div>
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent">
                  <IconClock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">3. {t('study.onboardingStep3')}</p>
                  <p className="text-xs text-muted">{t('study.onboardingStep3Desc')}</p>
                </div>
              </li>
            </ol>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => navigate('/')}
                icon={<IconTranslate className="h-4 w-4" />}
              >
                {t('study.listAddFromTranslate')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => navigate('/learn/decks')}
                icon={<IconStar className="h-4 w-4" />}
              >
                {t('study.tileDecks')}
              </Button>
            </div>
          </Card>
        ) : (
          /* 1. Главный блок повторения */
          <Card className="relative overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                {streak > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                    <IconFlame className="h-4 w-4" />
                    <span>{t('study.streakValue', { count: streak })}</span>
                  </div>
                ) : null}

                {sessionSize > 0 ? (
                  <>
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {t('study.todayDue', { count: sessionSize })}
                    </h2>
                    <p className="text-sm text-muted">
                      {t('study.reviewPrompt', { defaultValue: 'Интервальное повторение на сегодня' })}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {t('study.allDoneForToday')}
                    </h2>
                    <p className="text-sm text-muted">
                      {t('study.reviewEmptyText')}
                    </p>
                  </>
                )}
              </div>

              <div>
                {sessionSize > 0 ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto sm:min-w-[160px] h-12 text-base font-semibold shadow-md"
                    onClick={() => navigate('/learn/review')}
                  >
                    {t('study.startReview')}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full sm:w-auto h-12 text-sm font-semibold"
                    onClick={() => navigate('/learn/decks')}
                  >
                    {t('study.learnNewWords')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* 2. Мои слова: сколько всего, сколько выучено, полоска прогресса */}
        {!isEmpty ? (
          <Card className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold">{t('study.myWordsTitle')}</h3>
                <span className="text-xs text-muted">
                  {t('study.myWordsProgress', { total: totalCards, learned: learnedCount })}
                </span>
              </div>
              <Link
                to="/learn/progress"
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <span>{learnedPercent}%</span>
                <span>→</span>
              </Link>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${learnedPercent}%` }}
              />
            </div>
          </Card>
        ) : null}

        {/* 3. Три понятные карточки-плитки с одной строкой пояснения */}
        <div className="grid gap-3 sm:grid-cols-3">
          <StudyTile
            to="/learn/lists"
            icon={<IconBookmark className="h-5 w-5" />}
            title={t('study.tileMyDecks')}
            hint={t('study.tileMyDecksHint')}
          />
          <StudyTile
            to="/learn/decks"
            icon={<IconStar className="h-5 w-5" />}
            title={t('study.tileReadySets')}
            hint={t('study.tileReadySetsHint')}
          />
          <StudyTile
            to="/learn/practice/translation"
            icon={<IconSparkles className="h-5 w-5" />}
            title={t('study.tileTraining')}
            hint={t('study.tileTrainingHint')}
          />
        </div>

        {/* Дополнительно: Слово дня и график активности */}
        <WordOfDayCard />

        {!isEmpty ? (
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{t('study.weekTitle')}</h2>
                <span className="text-xs text-muted">
                  ({today.reviews + today.exercises} / {goal})
                </span>
              </div>
              <Link
                to="/learn/progress"
                className="text-xs font-medium text-accent hover:underline"
              >
                {t('study.viewFullProgress')} →
              </Link>
            </div>
            <WeekChart days={week} />
          </Card>
        ) : null}
      </div>
    </>
  );
}
