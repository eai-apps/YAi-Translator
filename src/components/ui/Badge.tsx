/** Небольшая плашка-метка (уровень языка, стиль перевода, провайдер). */
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'neutral' | 'accent' | 'success';

const TONES: Record<Tone, string> = {
  neutral: 'bg-soft text-muted',
  accent: 'bg-accentSoft text-accent',
  success: 'bg-soft text-success',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
