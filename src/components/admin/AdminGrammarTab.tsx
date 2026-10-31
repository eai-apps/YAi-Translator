/**
 * Вкладка «Грамматика» админки (версия 0.6.0): список тем со статусом,
 * просмотр, правка текста, «Перегенерировать» и «Добавить тему».
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminGrammarInput, AdminGrammarTopic, GrammarLevel } from '../../../shared/types';
import { GRAMMAR_LEVELS } from '../../../shared/grammarTopics';
import { useAdminGrammar } from '../../hooks/useAdminGrammar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { GrammarForm } from './GrammarForm';

interface AdminGrammarTabProps {
  onError: (message: string | null) => void;
}

export function AdminGrammarTab({ onError }: AdminGrammarTabProps) {
  const { t } = useTranslation();
  const grammar = useAdminGrammar(onError);
  const [editing, setEditing] = useState<AdminGrammarTopic | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<GrammarLevel | 'all'>('all');

  const items = grammar.data?.items ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesLevel = level === 'all' || item.level === level;
      const matchesQuery =
        !needle || [item.slug, item.titleRu, item.titleDe, item.titleEn].some((value) => value.toLowerCase().includes(needle));
      return matchesLevel && matchesQuery;
    });
  }, [items, query, level]);

  const filled = items.filter((item) => item.filled).length;

  if (!grammar.data) return null;

  /** Сохранение формы: новая тема или правка существующей. */
  const save = async (input: AdminGrammarInput, isNew: boolean): Promise<boolean> => {
    const ok = await grammar.run(isNew ? 'add' : `save-${input.slug}`, { action: isNew ? 'add' : 'update', ...input });
    if (ok) {
      setEditing(null);
      setAdding(false);
    }
    return ok;
  };

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionTitle>{t('admin.grammar.title')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.grammar.intro')}</p>
        <p className="mt-2 text-xs text-muted">
          {t('grammar.statusFilled')}: {filled} / {items.length}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('admin.grammar.search')}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-card px-3 text-sm text-ink"
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('grammar.levelFilter')}>
            {(['all', ...GRAMMAR_LEVELS] as Array<GrammarLevel | 'all'>).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === level}
                onClick={() => setLevel(value)}
                className={
                  value === level
                    ? 'rounded-xl bg-accent px-2.5 py-1 text-xs font-medium text-accentInk'
                    : 'rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-medium text-muted hover:text-ink'
                }
              >
                {value === 'all' ? t('admin.grammar.filterAll') : value}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {adding || editing ? (
        <GrammarForm
          editing={editing}
          busy={grammar.busy === (editing ? `save-${editing.slug}` : 'add')}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      ) : (
        <Button variant="primary" onClick={() => setAdding(true)}>
          {t('admin.grammar.addTitle')}
        </Button>
      )}

      <Card className="p-3 sm:p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.grammar.emptyList')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((item) => (
              <li key={item.slug} className="flex flex-wrap items-start gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {item.titleRu}
                    <span className="ml-2 text-xs font-normal text-muted">{item.titleDe}</span>
                  </p>
                  <p className="text-[11px] text-muted">
                    {item.slug} · {item.level} · {t(`grammar.category.${item.category}`)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span
                    className={
                      item.filled
                        ? 'rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium text-success'
                        : 'rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium text-muted'
                    }
                  >
                    {item.filled ? t('admin.grammar.filled') : t('admin.grammar.empty')}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>
                    {t('admin.grammar.edit')}
                  </Button>
                  <Button
                    size="sm"
                    loading={grammar.busy === `regen-${item.slug}`}
                    disabled={grammar.busy !== null}
                    onClick={() => {
                      if (!window.confirm(t('admin.grammar.confirmRegenerate', { title: item.titleDe || item.slug }))) return;
                      void grammar.run(
                        `regen-${item.slug}`,
                        { action: 'regenerate', slug: item.slug },
                        'admin.grammar.regenerateFailed',
                      );
                    }}
                  >
                    {grammar.busy === `regen-${item.slug}` ? t('admin.grammar.regenerating') : t('admin.grammar.regenerate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={grammar.busy !== null}
                    onClick={() => {
                      if (!window.confirm(t('admin.grammar.confirmRemove', { title: item.titleRu || item.slug }))) return;
                      void grammar.run(`delete-${item.slug}`, { action: 'delete', slug: item.slug });
                    }}
                  >
                    {t('admin.grammar.remove')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
