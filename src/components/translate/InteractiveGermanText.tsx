/**
 * Текст на немецком языке с интерактивными словами (этап 13).
 * Слова, найденные в базе лексикона, получают тонкое пунктирное подчёркивание;
 * нажатие открывает мгновенную карточку слова.
 */
import type { ConnectedWordItem } from '../../hooks/useConnectedWords';
import { cn } from '../../lib/cn';

interface InteractiveGermanTextProps {
  text: string;
  matchedWordsMap: Map<string, ConnectedWordItem>;
  onWordClick: (item: ConnectedWordItem) => void;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export function InteractiveGermanText({
  text,
  matchedWordsMap,
  onWordClick,
  className,
  dir = 'ltr',
}: InteractiveGermanTextProps) {
  if (!text) return null;

  // Если слов в базе пока нет — просто выводим текст
  if (matchedWordsMap.size === 0) {
    return (
      <span dir={dir} className={className}>
        {text}
      </span>
    );
  }

  // Разбиваем текст с сохранением разделителей (пробелы, пунктуация)
  const parts = text.split(/([\p{L}\p{M}äöüßÄÖÜ]+)/gu);

  return (
    <span dir={dir} className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        const lower = part.toLowerCase();
        const matched = matchedWordsMap.get(lower);

        if (matched) {
          const tooltip = matched.translation
            ? `${matched.match.lemma} · ${matched.translation}`
            : matched.match.lemma;

          return (
            <span
              key={`w-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(matched);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onWordClick(matched);
                }
              }}
              title={tooltip}
              aria-label={tooltip}
              className={cn(
                'cursor-pointer border-b border-dotted border-current transition-colors',
                'hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm',
              )}
            >
              {part}
            </span>
          );
        }

        return <span key={`t-${index}`}>{part}</span>;
      })}
    </span>
  );
}
