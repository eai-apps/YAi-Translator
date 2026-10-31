/** Плитка на экране «Учёба»: иконка, название и подпись (этап 6). */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

interface StudyTileProps {
  to: string;
  icon: ReactNode;
  title: string;
  hint?: string;
  className?: string;
}

export function StudyTile({ to, icon, title, hint, className }: StudyTileProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-card transition-colors hover:border-accent',
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">{title}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span> : null}
      </span>
    </Link>
  );
}
