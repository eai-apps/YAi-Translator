/**
 * Логотип YAi: крупная «Y», заглавная «A» и маленькая «i», у которой вместо точки — искра ИИ.
 * Тот же рисунок лежит в public/logo.svg (из него делаются иконки: npm run icons).
 */
import { useId } from 'react';

export function Logo({ size = 40, withWordmark = false }: { size?: number; withWordmark?: boolean }) {
  const id = useId();
  const bg = `${id}-bg`;
  const spark = `${id}-spark`;

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="YAi" className="shrink-0">
        <defs>
          <linearGradient id={bg} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4f7bff" />
            <stop offset="1" stopColor="#6d3df5" />
          </linearGradient>
          <linearGradient id={spark} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#ffb84d" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="116" fill={`url(#${bg})`} />
        <path
          d="M100 124 L190 262 L280 124 M190 262 V404"
          fill="none"
          stroke="#ffffff"
          strokeWidth="66"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M308 404 L352 262 L396 404 M324 356 H380"
          fill="none"
          stroke="#dbe3ff"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M440 318 V404" fill="none" stroke="#dbe3ff" strokeWidth="30" strokeLinecap="round" />
        <path
          d="M440 234 C443 256 448 261 470 264 C448 267 443 272 440 294 C437 272 432 267 410 264 C432 261 437 256 440 234 Z"
          fill={`url(#${spark})`}
        />
      </svg>
      {withWordmark ? (
        <span className="leading-tight">
          <span className="block text-base font-semibold tracking-tight">
            Y<span className="text-accent">A</span>
            <span className="text-accent">i</span>
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Translator</span>
        </span>
      ) : null}
    </span>
  );
}
