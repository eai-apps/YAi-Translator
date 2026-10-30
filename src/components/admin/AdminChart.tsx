/** Простой SVG-график за 30 дней: две линии (переводы и посетители) без сторонних библиотек. */
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

interface Point {
  day: string;
  translations: number;
  visitors: number;
}

interface AdminChartProps {
  data: Point[];
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD_X = 8;
const PAD_Y = 12;

/** Координаты линии в поле графика. */
function line(values: number[], max: number): string {
  if (values.length === 0) return '';
  const stepX = values.length > 1 ? (WIDTH - PAD_X * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = PAD_X + index * stepX;
      const y = HEIGHT - PAD_Y - (max === 0 ? 0 : (value / max) * (HEIGHT - PAD_Y * 2));
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function AdminChart({ data }: AdminChartProps) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const empty = data.every((point) => point.translations === 0 && point.visitors === 0);
  const max = Math.max(1, ...data.map((point) => Math.max(point.translations, point.visitors)));

  const translationsLine = line(data.map((point) => point.translations), max);
  const visitorsLine = line(data.map((point) => point.visitors), max);
  const first = data[0];
  const last = data[data.length - 1];

  const formatDay = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
      new Date(`${day}T00:00:00Z`),
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
          {t('admin.overview.chartTranslations')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
          {t('admin.overview.chartVisitors')}
        </span>
        <span className="ml-auto tabular-nums">max {max}</span>
      </div>

      {empty ? (
        <p className="mt-3 rounded-xl bg-soft px-3 py-6 text-center text-sm text-muted">
          {t('admin.overview.chartEmpty')}
        </p>
      ) : null}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`mt-2 w-full ${empty ? 'opacity-40' : ''}`}
        role="img"
        aria-label={t('admin.overview.chartTitle')}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Сетка: три горизонтальные линии. */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_Y + ratio * (HEIGHT - PAD_Y * 2)}
            y2={PAD_Y + ratio * (HEIGHT - PAD_Y * 2)}
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
        ))}
        {translationsLine ? (
          <>
            <path
              d={`${translationsLine} L${WIDTH - PAD_X},${HEIGHT - PAD_Y} L${PAD_X},${HEIGHT - PAD_Y} Z`}
              fill={`url(#${id}-fill)`}
              className="text-accent"
            />
            <path d={translationsLine} fill="none" className="text-accent" stroke="currentColor" strokeWidth="2" />
          </>
        ) : null}
        {visitorsLine ? (
          <path
            d={visitorsLine}
            fill="none"
            strokeDasharray="4 4"
            className="text-success"
            stroke="currentColor"
            strokeWidth="2"
          />
        ) : null}
      </svg>

      {first && last ? (
        <div className="flex justify-between text-[11px] text-muted">
          <span>{formatDay(first.day)}</span>
          <span>{formatDay(last.day)}</span>
        </div>
      ) : null}
    </div>
  );
}
