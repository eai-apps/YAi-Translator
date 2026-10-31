/** Предложение с подсветкой искомого слова: лёгкий фон у найденных кусков (этап 8). */
import type { HighlightPart } from '../../lib/exampleHighlight';

interface HighlightedTextProps {
  parts: HighlightPart[];
  className?: string;
}

export function HighlightedText({ parts, className }: HighlightedTextProps) {
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-accentSoft px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
}
