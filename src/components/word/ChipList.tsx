/** Списки слов: синонимы, антонимы, управление предлогами. */
import { cn } from '../../lib/cn';
import { usePick } from './pick';

export function ChipList({
  items,
  tone = 'neutral',
}: {
  items: string[];
  tone?: 'neutral' | 'danger';
}) {
  const pick = usePick();
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          {pick ? (
            <button
              type="button"
              onClick={() => pick(item)}
              className={cn(
                'rounded-full px-2.5 py-1 text-sm transition hover:ring-2 hover:ring-accent/40 active:scale-95',
                tone === 'danger' ? 'bg-soft text-danger' : 'bg-soft text-ink',
              )}
            >
              {item}
            </button>
          ) : (
            <span
              className={cn(
                'inline-block rounded-full px-2.5 py-1 text-sm',
                tone === 'danger' ? 'bg-soft text-danger' : 'bg-soft text-ink',
              )}
            >
              {item}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
