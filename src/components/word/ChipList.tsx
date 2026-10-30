/** Списки слов: синонимы, антонимы, управление предлогами. */
import { cn } from '../../lib/cn';

export function ChipList({
  items,
  tone = 'neutral',
}: {
  items: string[];
  tone?: 'neutral' | 'danger';
}) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={cn(
            'rounded-full px-2.5 py-1 text-sm',
            tone === 'danger' ? 'bg-soft text-danger' : 'bg-soft text-ink',
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
