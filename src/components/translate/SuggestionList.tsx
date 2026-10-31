/** Список подсказок при наборе одного слова: до 6 слов, над полем ввода (этап 8). */
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

interface SuggestionListProps {
  items: string[];
  /** Номер подсвеченной подсказки (стрелки ↑↓), -1 — не подсвечена. */
  highlighted: number;
  onPick: (value: string) => void;
  /** Наведение мышью тоже подсвечивает подсказку. */
  onHighlight: (index: number) => void;
}

export function SuggestionList({ items, highlighted, onPick, onHighlight }: SuggestionListProps) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label={t('translate.suggestionsLabel')}
      className="mb-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-card p-1 shadow-card"
    >
      {items.map((item, index) => (
        <li key={item} role="option" aria-selected={index === highlighted}>
          <button
            type="button"
            // На телефоне касание не должно уводить фокус из поля ввода раньше времени.
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onHighlight(index)}
            onClick={() => onPick(item)}
            className={cn(
              'flex w-full items-baseline gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
              index === highlighted ? 'bg-accentSoft text-accent' : 'text-ink hover:bg-soft',
            )}
          >
            <span className="text-[11px] text-muted" aria-hidden="true">
              ▸
            </span>
            <span className="min-w-0 truncate">{item}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
