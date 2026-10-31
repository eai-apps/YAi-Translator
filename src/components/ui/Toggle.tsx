/** Переключатель-тумблер для настроек (этап 8): подпись, пояснение и включение/выключение. */
import { useId } from 'react';
import { cn } from '../../lib/cn';

interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, hint, checked, onChange, disabled = false }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className={cn('cursor-pointer text-sm font-medium', disabled && 'opacity-60')}>
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-40',
          checked ? 'border-accent bg-accent' : 'border-line bg-soft',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] rounded-full bg-card shadow-sm transition-all',
            checked ? 'left-[1.625rem]' : 'left-[3px]',
          )}
          style={{ height: '1.125rem', width: '1.125rem' }}
        />
      </button>
    </div>
  );
}
