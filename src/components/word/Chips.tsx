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
  /** Короткий перевод под словом (этап 8Б): «bringen» → «приносить». */
  glossary?: Record<string, string>;
}

const TONES = {
  accent: 'bg-accentSoft text-accent hover:bg-accent hover:text-accentInk',
  neutral: 'bg-soft text-ink hover:bg-accentSoft hover:text-accent',
  danger: 'bg-soft text-danger hover:bg-accentSoft',
} as const;

/** Перевод связанного слова по ключу: точное совпадение, затем без регистра и артикля. */
function glossaryValue(glossary: Record<string, string>, word: string): string | null {
  const exact = glossary[word];
  if (exact) return exact;
  const normalized = word.trim().toLowerCase();
  for (const [key, value] of Object.entries(glossary)) {
    if (key.trim().toLowerCase() === normalized) return value;
  }
  return null;
}

export function Chips({ items, onPick, tone = 'neutral', limit, className, glossary }: ChipsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = limit && !expanded ? items.slice(0, limit) : items;
  const hidden = items.length - visible.length;

  if (items.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((item, index) => {
        const hint = glossary ? glossaryValue(glossary, item) : null;
        return (
          <li key={`${item}-${index}`}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className={cn(
                'rounded-full px-3 transition-colors active:scale-95',
                hint ? 'py-1 text-left leading-tight' : 'py-1 text-sm font-medium',
                TONES[tone],
              )}
            >
              <span className="block text-sm font-medium">{item}</span>
              {/* Перевод связанного слова — мелким серым, чтобы чипс оставался компактным. */}
              {hint ? <span className="block text-[11px] font-normal opacity-70">{hint}</span> : null}
            </button>
          </li>
        );
      })}
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
