/** Логотип YAi: скруглённый квадрат и буква Y. */
import { useId } from 'react';

export function Logo({ size = 40, withWordmark = false }: { size?: number; withWordmark?: boolean }) {
  const gradientId = useId();

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="YAi"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b8cff" />
            <stop offset="1" stopColor="#2f56d8" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="13" fill={`url(#${gradientId})`} />
        <path
          d="M13 13h5l6 9 6-9h5l-8.5 12.5V36h-5V25.5L13 13z"
          fill="#ffffff"
        />
      </svg>
      {withWordmark ? (
        <span className="leading-tight">
          <span className="block text-base font-semibold tracking-tight">YAi</span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            Translator
          </span>
        </span>
      ) : null}
    </span>
  );
}
