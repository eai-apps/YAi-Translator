/**
 * Список тем справочника: поиск по названию и фильтр по уровню A1–C1 (версия 0.6.0).
 * Группировка по разделам (артикли, падежи, времена…), чтобы правило находилось быстро.
 * Уровень и поиск живут в адресе страницы (?level=B1&q=…): фильтр можно сохранить в закладки.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GrammarLevel, GrammarTopicSummary } from '../../../shared/types';
import { GRAMMAR_CATEGORIES, GRAMMAR_LEVELS } from '../../../shared/grammarTopics';
import { grammarTitle } from './grammarLabels';
import { IconSearch } from '../layout/icons';

interface GrammarTopicListProps {
  items: GrammarTopicSummary[];
  uiLanguage: string;
  activeSlug: string | null;
  onSelect: (slug: string) => void;
}

/** Поиск по трём названиям сразу: «konjunktiv», «конъюнктив», «subjunctive». */
function matches(topic: GrammarTopicSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [topic.titleRu, topic.titleDe, topic.titleEn].some((title) => title.toLowerCase().includes(needle));
}

export function GrammarTopicList({ items, uiLanguage, activeSlug, onSelect }: GrammarTopicListProps) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const rawLevel = params.get('level');
  const level: GrammarLevel | 'all' =
    rawLevel && (GRAMMAR_LEVELS as readonly string[]).includes(rawLevel) ? (rawLevel as GrammarLevel) : 'all';

  const change = (key: 'q' | 'level', value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const bySearch = useMemo(() => items.filter((topic) => matches(topic, query)), [items, query]);
  const filtered = useMemo(
    () => (level === 'all' ? bySearch : bySearch.filter((topic) => topic.level === level)),
    [bySearch, level],
  );
  // Уровни показываем только те, что реально есть в списке.
  const levels = GRAMMAR_LEVELS.filter((value) => items.some((topic) => topic.level === value));

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{t('grammar.search')}</span>
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => change('q', event.target.value)}
          placeholder={t('grammar.searchPlaceholder')}
          className="h-10 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm text-ink placeholder:text-muted"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={t('grammar.levelFilter')}>
        {(['all', ...levels] as Array<GrammarLevel | 'all'>).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === level}
            onClick={() => change('level', value)}
            className={
              value === level
                ? 'rounded-xl bg-accent px-2.5 py-1 text-xs font-medium text-accentInk'
                : 'rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-medium text-muted hover:text-ink'
            }
          >
            {value === 'all' ? t('grammar.allLevels') : value}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted">{t('grammar.found', { count: filtered.length })}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('grammar.nothingFound')}</p>
      ) : (
        GRAMMAR_CATEGORIES.map((category) => {
          const group = filtered.filter((topic) => topic.category === category);
          if (group.length === 0) return null;
          return (
            <section key={category} className="mt-4">
              <h2 className="text-sm font-semibold text-muted">{t(`grammar.category.${category}`)}</h2>
              <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {group.map((topic) => (
                  <li key={topic.slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(topic.slug)}
                      aria-current={topic.slug === activeSlug ? 'true' : undefined}
                      className={
                        topic.slug === activeSlug
                          ? 'flex w-full items-start justify-between gap-2 rounded-xl border border-accent bg-accentSoft px-3 py-2 text-left'
                          : 'flex w-full items-start justify-between gap-2 rounded-xl border border-line bg-card px-3 py-2 text-left transition-colors hover:border-accent'
                      }
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-snug">
                          {grammarTitle(topic, uiLanguage)}
                        </span>
                        {topic.lang === 'en' ? (
                          uiLanguage !== 'en' && topic.titleEn ? (
                            <span className="mt-0.5 block text-xs text-muted">{topic.titleEn}</span>
                          ) : null
                        ) : uiLanguage !== 'de' ? (
                          <span className="mt-0.5 block text-xs text-muted">{topic.titleDe}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium text-muted">
                        {topic.level}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
