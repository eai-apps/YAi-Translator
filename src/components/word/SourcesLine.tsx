/** Строка «Источники: Wiktionary · OpenThesaurus · Tatoeba · PONS» со ссылками (этап 4). */
import { useTranslation } from 'react-i18next';
import type { DictSourceRef } from '../../../shared/types';

interface SourcesLineProps {
  sources: DictSourceRef[];
  className?: string;
}

export function SourcesLine({ sources, className }: SourcesLineProps) {
  const { t } = useTranslation();
  if (sources.length === 0) return null;

  return (
    <p className={className ?? 'mt-4 border-t border-line pt-2 text-[11px] leading-relaxed text-muted'}>
      {t('dict.sourcesLine')}{' '}
      {sources.map((source, index) => (
        <span key={source.id}>
          {index > 0 ? ' · ' : null}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            {source.name}
          </a>
        </span>
      ))}
    </p>
  );
}
