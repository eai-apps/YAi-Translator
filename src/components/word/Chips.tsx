/**
 * Чипсы (этап 8): переводы значений и связанные слова. Нажатие отдаёт слово наружу —
 * страница перевода сразу переводит его (как в Яндекс.Переводчике).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

interface ChipsProps {
  items: string[];
  onPick: (value: string) => void;
  /** accent — светло-синие (переводы), neutral — мягкие, danger — антонимы. */
  tone?: 'accent' | 'neutral' | 'danger';
  /** Сколько показывать сразу; остальные — под «…ещё». */
  limit?: number;
  className?: string;
}

const TONES = {
  accent: 'bg-accentSoft text-accent hover:bg-accent hover:text-accentInk',
  neutral: 'bg-soft text-ink hover:bg-accentSoft hover:text-accent',
  danger: 'bg-soft text-danger hover:bg-accentSoft',
} as const;

export function Chips({ items, onPick, tone = 'neutral', limit, className }: ChipsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = limit && !expanded ? items.slice(0, limit) : items;
  const hidden = items.length - visible.length;

  if (items.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((item, index) => (
        <li key={`${item}-${index}`}>
          <button
            type="button"
            onClick={() => onPick(item)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors active:scale-95',
              TONES[tone],
            )}
          >
            {item}
          </button>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-dashed border-line px-3 py-1 text-sm text-muted hover:text-ink"
          >
            {t('word.more', { count: hidden })}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

/** Неактивная чипса: когда слова нажать нельзя (нет контекста перевода). */
export function ChipLabel({ children, tone = 'neutral' }: { children: string; tone?: 'neutral' | 'danger' }) {
  return (
    <span className={cn('inline-block rounded-full px-3 py-1 text-sm', TONES[tone])}>{children}</span>
  );
}
