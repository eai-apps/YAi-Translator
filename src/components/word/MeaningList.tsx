/** Значения слова по смыслам. */
import type { WordMeaning } from '../../../shared/types';

export function MeaningList({ meanings }: { meanings: WordMeaning[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {meanings.map((meaning, index) => (
        <li key={`${meaning.sense}-${index}`} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-soft text-[11px] font-semibold text-muted">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-base font-medium leading-snug sm:text-lg">
              {meaning.translations.join(', ')}
            </p>
            {meaning.sense || meaning.note ? (
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                {meaning.sense}
                {meaning.sense && meaning.note ? ' — ' : ''}
                {meaning.note}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
