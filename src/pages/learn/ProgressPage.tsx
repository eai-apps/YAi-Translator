/**
 * Экран «Мой прогресс» (этап 16):
 * 1. Сводка: всего слов, выучено, серия дней 🔥, цель на сегодня.
 * 2. Прогресс по языкам (de, en и др.).
 * 3. График активности за 30 дней (SVG-столбики без внешних библиотек).
 * 4. Самые трудные слова (по количеству ошибок lapses).
 * 5. Настройки учёбы: ежедневная цель (5 / 10 / 20 слов) и напоминание.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { STUDY_GOALS } from '../../../shared/study';
import { cn } from '../../lib/cn';
import { lastDays } from '../../lib/srs';
import { isReminderSupported, readReminderSettings, writeReminderSettings } from '../../lib/dailyReminder';
import type { ReminderSettings } from '../../lib/dailyReminder';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SpeakButton } from '../../components/ui/SpeakButton';
import {
  IconCheck,
  IconFlame,
  IconSparkles,
  IconStar,
} from '../../components/layout/icons';

export default function ProgressPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const speech = useSpeech();
  const { cards, progress, days, goal, newPerDay, streak, today, setGoal, setNewPerDay } = useStudy();

  // Напоминания в приложении
  const reminderSupported = isReminderSupported();
  const [reminder, setReminder] = useState<ReminderSettings>(readReminderSettings);

  const handleToggleReminder = async (enabled: boolean) => {
    const next = { ...reminder, enabled };
    setReminder(next);
    await writeReminderSettings(next, t('study.reminderBody'));
  };

  const handleReminderTimeChange = async (time: string) => {
    const next = { ...reminder, time };
    setReminder(next);
    await writeReminderSettings(next, t('study.reminderBody'));
  };

  // 30 дней активности
  const monthDays = useMemo(() => lastDays(days, 30), [days]);
  const maxReviews = useMemo(
    () => Math.max(1, ...monthDays.map((d) => d.reviews + d.exercises)),
    [monthDays],
  );
  const totalMonthReviews = useMemo(
    () => monthDays.reduce((acc, d) => acc + d.reviews + d.exercises, 0),
    [monthDays],
  );

  // Выученные слова: reps >= 3 или interval >= 7
  const progressMap = useMemo(() => {
    const map = new Map<string, (typeof progress)[0]>();
    for (const p of progress) map.set(p.cardId, p);
    return map;
  }, [progress]);

  // Группировка по языкам
  const langStats = useMemo(() => {
    const stats: Record<string, { total: number; learned: number }> = {
      de: { total: 0, learned: 0 },
      en: { total: 0, learned: 0 },
    };

    for (const card of cards) {
      const l = card.lang || 'de';
      if (!stats[l]) stats[l] = { total: 0, learned: 0 };
      stats[l].total += 1;
      const prog = progressMap.get(card.id);
      if (prog && (prog.interval >= 7 || prog.reps >= 3)) {
        stats[l].learned += 1;
      }
    }

    return Object.entries(stats).filter(([key, val]) => val.total > 0 || key === 'de' || key === 'en');
  }, [cards, progressMap]);

  // Самые трудные слова (по lapses и низкому ease)
  const difficultWords = useMemo(() => {
    const withStats = cards
      .map((card) => {
        const p = progressMap.get(card.id);
        return {
          card,
          lapses: p?.lapses ?? 0,
          reps: p?.reps ?? 0,
          ease: p?.ease ?? 2.5,
        };
      })
      .filter((item) => item.lapses > 0 || (item.reps > 1 && item.ease < 2.2));

    withStats.sort((a, b) => b.lapses - a.lapses || a.ease - b.ease);
    return withStats.slice(0, 10);
  }, [cards, progressMap]);

  const totalCards = cards.length;
  const totalLearned = progress.filter((p) => p.interval >= 7 || p.reps >= 3).length;
  const learnedPercent = totalCards > 0 ? Math.round((totalLearned / totalCards) * 100) : 0;

  return (
    <>
      <PageHeader title={t('study.progressTitle')} subtitle={t('study.progressSubtitle')} />

      <div className="space-y-4">
        {/* 1. Общие показатели */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="p-4 text-center">
            <span className="text-2xl font-bold text-accent sm:text-3xl">{totalCards}</span>
            <p className="mt-1 text-xs text-muted">{t('study.progressTotalCards')}</p>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-2xl font-bold text-success sm:text-3xl">{totalLearned}</span>
            <p className="mt-1 text-xs text-muted">
              {t('study.progressLearnedCards')} ({learnedPercent}%)
            </p>
          </Card>

          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-accent sm:text-3xl">
              <IconFlame className="h-6 w-6 text-amber-500" />
              <span>{streak}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{t('study.streakDays', { count: streak })}</p>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-2xl font-bold text-ink sm:text-3xl">
              {today.reviews + today.exercises} / {goal}
            </span>
            <p className="mt-1 text-xs text-muted">{t('study.progressTodayGoal')}</p>
          </Card>
        </div>

        {/* 2. Прогресс по языкам */}
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold">{t('study.progressByLanguage')}</h2>
          <div className="space-y-3">
            {langStats.map(([langCode, stat]) => {
              const flag = langCode === 'en' ? '🇬🇧' : '🇩🇪';
              const name = langCode === 'en' ? 'English' : 'Deutsch';
              const percent = stat.total > 0 ? Math.round((stat.learned / stat.total) * 100) : 0;

              return (
                <div key={langCode} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{flag}</span>
                      <span>{name}</span>
                    </span>
                    <span className="text-muted">
                      {stat.learned} / {stat.total} {t('study.words')} ({percent}%)
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 3. График за 30 дней */}
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">{t('study.progressChart30')}</h2>
              <p className="text-xs text-muted">
                {t('study.progressChartTotal', { count: totalMonthReviews })}
              </p>
            </div>
            <Badge tone="accent">{monthDays.length} {t('study.days')}</Badge>
          </div>

          <div className="flex h-36 items-end gap-1 pt-4">
            {monthDays.map((d, index) => {
              const sum = d.reviews + d.exercises;
              const heightPercent = maxReviews > 0 ? Math.max(4, Math.round((sum / maxReviews) * 100)) : 4;
              const isToday = index === monthDays.length - 1;
              const dayNum = d.day.slice(8);

              return (
                <div
                  key={d.day}
                  className="group relative flex flex-1 flex-col items-center justify-end h-full"
                  title={`${d.day}: ${d.reviews} повторений, ${d.exercises} упражнений`}
                >
                  {/* Всплывающая подсказка */}
                  <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] text-card shadow group-hover:block">
                    {d.day.slice(5)}: {sum}
                  </div>

                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      sum === 0
                        ? 'bg-soft'
                        : isToday
                        ? 'bg-accent'
                        : 'bg-accentSoft group-hover:bg-accent',
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {index % 5 === 0 || isToday ? (
                    <span className="mt-1 text-[9px] text-muted">{dayNum}</span>
                  ) : (
                    <span className="mt-1 h-3 text-[9px] opacity-0">.</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* 4. Самые трудные слова */}
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">{t('study.difficultWordsTitle')}</h2>
            <span className="text-xs text-muted">{difficultWords.length}</span>
          </div>

          {difficultWords.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted">
              <IconSparkles className="mx-auto mb-2 h-6 w-6 text-accent" />
              <p>{t('study.noDifficultWords')}</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {difficultWords.map(({ card, lapses }) => {
                const lang = card.lang || 'de';
                const spoken = card.article ? `${card.article} ${card.lemma}` : card.lemma;

                return (
                  <div key={card.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        {card.article ? (
                          <span className="text-xs font-bold uppercase text-accent">
                            {card.article}
                          </span>
                        ) : null}
                        <span className="truncate text-sm font-medium">{card.lemma}</span>
                        <span className="text-[10px] text-muted">({lang.toUpperCase()})</span>
                      </div>
                      <p className="truncate text-xs text-muted">
                        {card.translations.join(', ')}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="neutral" className="border border-line text-danger">
                        {t('study.lapsesCount', { count: lapses })}
                      </Badge>
                      <SpeakButton
                        text={spoken}
                        language={lang}
                        id={`diff-${card.id}`}
                        speech={speech}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 5. Настройки учёбы */}
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold">{t('study.settingsTitle')}</h2>

          <div className="space-y-4">
            {/* Ежедневная цель */}
            <div>
              <label className="block text-xs font-medium text-muted">
                {t('study.settingDailyGoal')}
              </label>
              <div className="mt-1.5 flex gap-2">
                {STUDY_GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={cn(
                      'flex-1 rounded-xl border py-2 text-center text-xs font-semibold transition-colors',
                      goal === g
                        ? 'border-accent bg-accentSoft text-accent'
                        : 'border-line bg-card text-ink hover:bg-soft',
                    )}
                  >
                    {t('study.goalOption', { count: g })}
                  </button>
                ))}
              </div>
            </div>

            {/* Новых слов в день */}
            <div>
              <label className="block text-xs font-medium text-muted">
                {t('study.settingNewPerDay')}
              </label>
              <div className="mt-1.5 flex gap-2">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewPerDay(num)}
                    className={cn(
                      'flex-1 rounded-xl border py-2 text-center text-xs font-semibold transition-colors',
                      newPerDay === num
                        ? 'border-accent bg-accentSoft text-accent'
                        : 'border-line bg-card text-ink hover:bg-soft',
                    )}
                  >
                    {t('study.newWordsOption', { count: num })}
                  </button>
                ))}
              </div>
            </div>

            {/* Напоминание в приложении */}
            {reminderSupported ? (
              <div className="border-t border-line pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t('study.reminderTitle')}</p>
                    <p className="text-xs text-muted">{t('study.reminderSubtitle')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminder.enabled}
                    onChange={(e) => handleToggleReminder(e.target.checked)}
                    aria-label={t('study.reminderTitle')}
                    className="h-5 w-5 rounded border-line text-accent focus:ring-accent"
                  />
                </div>

                {reminder.enabled ? (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted">{t('study.reminderTime')}</span>
                    <input
                      type="time"
                      value={reminder.time}
                      onChange={(e) => handleReminderTimeChange(e.target.value)}
                      aria-label={t('study.reminderTime')}
                      className="rounded-xl border border-line bg-card px-3 py-1 text-sm outline-none focus:border-accent"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>

        {/* Быстрые переходы */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => navigate('/learn/review')}
            icon={<IconCheck className="h-4 w-4" />}
          >
            {t('study.startReview')}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/learn/decks')}
            icon={<IconStar className="h-4 w-4" />}
          >
            {t('study.tileReadySets')}
          </Button>
        </div>
      </div>
    </>
  );
}
