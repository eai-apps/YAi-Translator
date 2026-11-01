/**
 * Таблица грамматических форм (неправильные глаголы, фразовые глаголы) (этап 18, версия 0.20.0).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GrammarTable } from '../../../shared/types';
import { SectionTitle } from '../ui/SectionTitle';
import { IconSearch } from '../layout/icons';

interface GrammarTableSectionProps {
  table: GrammarTable;
}

export function GrammarTableSection({ table }: GrammarTableSectionProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  if (!table || !table.rows || table.rows.length === 0) return null;

  const query = filter.trim().toLowerCase();
  const filtered = query
    ? table.rows.filter(
        (r) =>
          r.col1.toLowerCase().includes(query) ||
          r.col2.toLowerCase().includes(query) ||
          (r.col3 && r.col3.toLowerCase().includes(query)) ||
          (r.col4 && r.col4.toLowerCase().includes(query)),
      )
    : table.rows;

  return (
    <section className="mt-6 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <SectionTitle>{t('grammar.tableTitle', 'Сводная таблица форм')}</SectionTitle>
        <div className="relative w-full sm:w-48">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('grammar.tableFilter', 'Поиск по таблице...')}
            className="h-8 w-full rounded-lg border border-line bg-card pl-8 pr-2.5 text-xs text-ink placeholder:text-muted"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-line text-left text-xs sm:text-sm">
          <thead className="sticky top-0 bg-soft text-muted font-semibold z-10">
            <tr>
              {table.headers.map((h, idx) => (
                <th key={idx} className="px-3 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-card">
            {filtered.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-soft/40 transition-colors">
                <td className="px-3 py-2 font-medium text-ink">{row.col1}</td>
                <td className="px-3 py-2 text-ink">{row.col2}</td>
                {row.col3 !== undefined ? <td className="px-3 py-2 text-ink">{row.col3}</td> : null}
                {row.col4 !== undefined ? <td className="px-3 py-2 text-muted">{row.col4}</td> : null}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={table.headers.length} className="px-3 py-4 text-center text-muted">
                  {t('grammar.nothingFound', 'Ничего не найдено')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted mt-1.5 text-right">
        {t('grammar.tableCount', { count: filtered.length, total: table.rows.length })}
      </p>
    </section>
  );
}
