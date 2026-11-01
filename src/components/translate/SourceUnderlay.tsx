/**
 * Подложка под textarea для отображения волнистых линий под ошибками (LanguageTool).
 * Красная волнистая линия — орфография/опечатки, янтарная — грамматика.
 */
import type { ReactNode } from 'react';
import type { Correction } from '../../../shared/types';

interface SourceUnderlayProps {
  text: string;
  corrections: Correction[];
}

export function SourceUnderlay({ text, corrections }: SourceUnderlayProps) {
  if (!text || corrections.length === 0) return null;

  // Сортируем ошибки по смещению
  const valid = corrections
    .filter((c) => typeof c.offset === 'number' && typeof c.length === 'number' && (c.length ?? 0) > 0)
    .sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0));

  if (valid.length === 0) return null;

  const elements: ReactNode[] = [];
  let lastIdx = 0;

  valid.forEach((corr, i) => {
    const start = Math.max(0, corr.offset ?? 0);
    const end = Math.min(text.length, start + (corr.length ?? 0));
    if (start < lastIdx) return; // Пропускаем пересекающиеся

    if (start > lastIdx) {
      elements.push(
        <span key={`plain-${i}`} className="text-transparent">
          {text.slice(lastIdx, start)}
        </span>,
      );
    }

    const isGrammar = corr.type === 'grammar';
    elements.push(
      <span
        key={`err-${i}`}
        className={`text-transparent underline decoration-wavy underline-offset-4 decoration-2 ${
          isGrammar ? 'decoration-amber-500' : 'decoration-rose-500'
        }`}
      >
        {text.slice(start, end)}
      </span>,
    );

    lastIdx = end;
  });

  if (lastIdx < text.length) {
    elements.push(
      <span key="plain-last" className="text-transparent">
        {text.slice(lastIdx)}
      </span>,
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden py-2 pl-1 pr-10 text-lg leading-relaxed sm:text-xl font-sans whitespace-pre-wrap break-words"
    >
      {elements}
    </div>
  );
}
