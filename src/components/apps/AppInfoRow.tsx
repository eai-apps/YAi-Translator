/** Строка «название — значение (+ подпись)» в карточках страницы «Приложения». */
import type { ReactNode } from 'react';

interface AppInfoRowProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

export function AppInfoRow({ label, value, hint }: AppInfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-soft px-3.5 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right">
        <span className="block text-sm font-semibold text-ink">{value}</span>
        {hint ? <span className="block text-[11px] text-muted">{hint}</span> : null}
      </span>
    </div>
  );
}

/** Нумерованные шаги установки. */
export function AppSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentSoft text-[11px] font-semibold text-accent">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
