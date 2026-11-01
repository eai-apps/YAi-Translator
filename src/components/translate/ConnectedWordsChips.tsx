/**
 * Горизонтальная карусель чипов «Слова из словаря» (этап 13).
 * Показывается под панелью перевода: листается пальцем влево-вправо,
 * отображает артикль цветом (der синий, die красный, das зелёный),
 * перевод слова и кнопку «+ В учёбу» / «✓ В учёбе».
 */
import { useTranslation } from 'react-i18next';
import type { ConnectedWordItem } from '../../hooks/useConnectedWords';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { AddToStudyQuickButton } from '../study/AddToStudyQuickButton';

interface ConnectedWordsChipsProps {
  items: ConnectedWordItem[];
  onSelectWord: (item: ConnectedWordItem) => void;
}

export function ConnectedWordsChips({ items, onSelectWord }: ConnectedWordsChipsProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <section className="mt-3 animate-fade-in" aria-label={t('translate.dictionaryWords')}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('translate.dictionaryWords')}
        </h3>
        <span className="text-[11px] text-muted">
          {items.length}
        </span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x focus:outline-none"
        tabIndex={0}
      >
        {items.map((item) => {
          const article = item.article;
          const isDeArticle = article && (article === 'der' || article === 'die' || article === 'das');
          const itemLang = item.lang || item.match.lang || 'de';
          return (
            <div
              key={`${item.raw}-${item.match.lemma}`}
              onClick={() => onSelectWord(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectWord(item);
                }
              }}
              className={cn(
                'group flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3 py-2',
                'shadow-sm transition-all hover:border-accent hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent snap-start',
              )}
            >
              <div className="flex items-baseline gap-1.5 text-sm font-medium">
                {isDeArticle ? (
                  <span className={cn('text-xs font-bold uppercase tracking-wide', ARTICLE_COLORS[article])}>
                    {article}
                  </span>
                ) : article ? (
                  <span className="text-[11px] font-semibold uppercase text-muted">
                    ({article})
                  </span>
                ) : null}
                <span className="text-ink font-semibold group-hover:text-accent">
                  {item.match.lemma}
                </span>
                {item.translation ? (
                  <span className="text-xs text-muted">
                    · {item.translation}
                  </span>
                ) : null}
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <AddToStudyQuickButton
                  lemma={item.match.lemma}
                  lang={itemLang}
                  article={isDeArticle ? article : null}
                  translations={item.translation ? [item.translation] : undefined}
                  variant="chip"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
