/** Карточка — основной контейнер контента. */
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-line bg-card shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}
