/** Столбики за 7 дней (этап 6): сколько карточек повторено в каждый день. */
import { useTranslation } from 'react-i18next';
import type { ChartDay } from '../../lib/srs';

interface WeekChartProps {
  days: ChartDay[];
}

export function WeekChart({ days }: WeekChartProps) {
  const { t, i18n } = useTranslation();
  const max = Math.max(1, ...days.map((day) => day.reviews));
  const total = days.reduce((sum, day) => sum + day.reviews, 0);

  const weekday = (key: string) => {
    const date = new Date(`${key}T12:00:00`);
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(date);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-1.5" role="img" aria-label={t('study.weekTitle')}>
        {days.map((day) => {
          const height = day.reviews === 0 ? 4 : Math.max(8, Math.round((day.reviews / max) * 56));
          return (
            <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted">{day.reviews > 0 ? day.reviews : ''}</span>
              <div className="flex h-14 w-full items-end">
                <div
                  className={`w-full rounded-md transition-all ${
                    day.reviews > 0 ? 'bg-accent' : 'bg-soft'
                  }`}
                  style={{ height }}
                  title={t('study.weekReviews', { count: day.reviews })}
                />
              </div>
              <span className="truncate text-[10px] text-muted">{weekday(day.day)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        {total > 0 ? t('study.weekTotal', { count: total }) : t('study.weekEmpty')}
      </p>
    </div>
  );
}
