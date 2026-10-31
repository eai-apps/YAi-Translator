/**
 * Ссылки на темы справочника, которые назвал ИИ (версия 0.6.0).
 * Сервер проверяет список slug, поэтому здесь всегда существующие темы.
 * Название берётся из загруженного списка тем; пока его нет — показывается slug.
 */
import { useTranslation } from 'react-i18next';
import { useGrammar, useGrammarContext } from './useGrammar';
import { grammarTitle } from './grammarLabels';

interface GrammarTopicLinksProps {
  topics: string[];
  titleKey?: string;
  className?: string;
}

export function GrammarTopicLinks({ topics, titleKey = 'grammar.relatedTitle', className }: GrammarTopicLinksProps) {
  const { t, i18n } = useTranslation();
  const { open } = useGrammar();
  const { topics: all } = useGrammarContext();
  if (topics.length === 0) return null;

  return (
    <section className={className ?? 'mt-4'}>
      <p className="text-xs font-medium text-muted">{t(titleKey)}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {topics.map((slug) => {
          const summary = all.find((item) => item.slug === slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => open(slug)}
              className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {summary ? grammarTitle(summary, i18n.language) : slug}
            </button>
          );
        })}
      </div>
    </section>
  );
}
