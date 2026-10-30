/** Пустое состояние с иконкой. */
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  text?: string;
  className?: string;
}

export function EmptyState({ icon, title, text, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      {text ? <p className="max-w-xs text-sm leading-relaxed text-muted">{text}</p> : null}
    </div>
  );
}
