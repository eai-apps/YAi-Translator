/**
 * Небольшое выпадающее меню (этап 8): пилюля режима перевода и «⋯» у перевода.
 * Закрывается по клику мимо, Escape и выбору пункта; список рисуется под кнопкой.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  /** Галочка у выбранного пункта. */
  checked?: boolean;
  /** Необязательное пояснение справа (например, «мой ключ»). */
  hint?: string;
  disabled?: boolean;
  /** Разделитель перед этим пунктом. */
  separatorBefore?: boolean;
  /** Статус-точка (6 px): зелёная — работает, красная — ошибка, серая — не проверено. */
  dot?: 'green' | 'red' | 'gray';
}

interface DropdownMenuProps {
  /** Содержимое кнопки: у пилюли — текст и значок, у «⋯» — только значок. */
  trigger: ReactNode;
  items: MenuItem[];
  label: string;
  align?: 'left' | 'right';
  /** Пункт, перед которым показать линию-разделитель. */
  separatorBeforeId?: string | null;
  className?: string;
  buttonClassName?: string;
}

export function DropdownMenu({
  trigger,
  items,
  label,
  align = 'left',
  separatorBeforeId = null,
  className,
  buttonClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-soft',
          open && 'border-accent bg-accentSoft text-accent',
          buttonClassName,
        )}
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            'absolute z-40 mt-1.5 min-w-[220px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-card p-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <div key={item.id}>
              {separatorBeforeId === item.id || item.separatorBefore ? (
                <div className="my-1 border-t border-line" />
              ) : null}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={Boolean(item.checked)}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  item.checked ? 'bg-accentSoft font-medium text-accent' : 'text-ink hover:bg-soft',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                <span className="flex w-4 shrink-0 items-center justify-center text-center">
                  {item.checked ? (
                    '✓'
                  ) : item.dot ? (
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        item.dot === 'green' && 'bg-emerald-500',
                        item.dot === 'red' && 'bg-rose-500',
                        item.dot === 'gray' && 'bg-neutral-400',
                      )}
                    />
                  ) : (
                    ''
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint ? <span className="shrink-0 text-[11px] text-muted">{item.hint}</span> : null}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
