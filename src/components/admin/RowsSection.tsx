/** Повторяющийся блок формы темы: строки можно добавлять и убирать (версия 0.6.0). */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface RowsSectionProps<T> {
  title: string;
  addLabel: string;
  rows: T[];
  onAdd: () => void;
  onChange: (index: number, row: Partial<T>) => void;
  onRemove: (index: number) => void;
  render: (row: T, index: number, change: (patch: Partial<T>) => void) => ReactNode;
}

export function RowsSection<T>({ title, addLabel, rows, onAdd, onChange, onRemove, render }: RowsSectionProps<T>) {
  const { t } = useTranslation();
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{title}</span>
        <Button size="sm" variant="ghost" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      <ul className="mt-1 space-y-2">
        {rows.map((row, index) => (
          <li key={index} className="rounded-xl border border-line p-2">
            <div className="grid gap-1.5">{render(row, index, (patch) => onChange(index, patch))}</div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="mt-1 text-xs text-muted underline decoration-dotted hover:text-danger"
            >
              {t('common.delete')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
