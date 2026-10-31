/**
 * Горизонтальные вкладки-пилюли карточки слова (этап 8): прокручиваются вбок на телефоне
 * и прилипают к верху экрана при прокрутке (под верхней панелью).
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface CardTab<Id extends string> {
  id: Id;
  label: string;
}

interface CardTabsProps<Id extends string> {
  tabs: CardTab<Id>[];
  value: Id;
  onChange: (id: Id) => void;
}

export function CardTabs<Id extends string>({ tabs, value, onChange }: CardTabsProps<Id>) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Выбранная вкладка не должна уезжать за край при возврате к слову.
  useEffect(() => {
    const container = containerRef.current;
    const active = container?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!container || !active) return;
    const left = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [value]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={t('word.tabsLabel')}
      className="no-scrollbar -mx-1 sticky top-14 z-20 flex gap-1.5 overflow-x-auto rounded-lg bg-card px-1 py-1.5 lg:top-0"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-accentInk shadow-sm'
                : 'bg-soft text-muted hover:bg-accentSoft hover:text-accent',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
