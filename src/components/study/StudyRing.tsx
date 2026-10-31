/**
 * Кольцо цели дня и серия (этап 6): SVG без библиотек.
 * Под кольцом — выбор цели 10 / 20 / 30 карточек.
 */
import { useTranslation } from 'react-i18next';
import { STUDY_GOALS } from '../../../shared/study';
import { Segmented } from '../ui/Segmented';
import { Card } from '../ui/Card';
import { IconFlame } from '../layout/icons';

interface StudyRingProps {
  reviews: number;
  goal: number;
  streak: number;
  onGoalChange: (goal: number) => void;
}

const SIZE = 112;
const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StudyRing({ reviews, goal, streak, onGoalChange }: StudyRingProps) {
  const { t } = useTranslation();
  const ratio = goal > 0 ? Math.min(1, reviews / goal) : 0;
  const done = reviews >= goal;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth="10" className="stroke-soft" />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
              className="stroke-accent transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums">{reviews}</span>
            <span className="text-[11px] text-muted">/ {goal}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <IconFlame className="h-4 w-4 text-accent" />
            <span>{t('study.streakValue', { count: streak })}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {done ? t('study.goalDone') : t('study.goalProgress', { done: reviews, goal })}
          </p>
          <div className="mt-3">
            <p className="mb-1 text-[11px] text-muted">{t('study.goalTitle')}</p>
            <Segmented
              ariaLabel={t('study.goalTitle')}
              value={String(goal)}
              onChange={(value) => onGoalChange(Number(value))}
              options={STUDY_GOALS.map((value) => ({ value: String(value), label: String(value) }))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
