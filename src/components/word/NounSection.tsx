/** Существительное: род, множественное число и склонение по 4 падежам. */
import { useTranslation } from 'react-i18next';
import type { DeclensionRow } from '../../../shared/types';
import { grammaticalCaseKey } from '../../lib/labels';
import { SectionTitle } from '../ui/SectionTitle';

interface NounSectionProps {
  article: 'der' | 'die' | 'das' | null;
  plural: string | null;
  declension: DeclensionRow[] | null;
}

export function NounSection({ article, plural, declension }: NounSectionProps) {
  const { t } = useTranslation();
  if (!article && !plural && !declension) return null;

  return (
    <section className="mt-5">
      <SectionTitle>{t('word.declension')}</SectionTitle>

      {plural ? (
        <p className="mt-2 text-sm">
          <span className="text-muted">{t('word.plural')}: </span>
          <span className="font-medium">{plural}</span>
        </p>
      ) : null}

      {declension ? (
        <div className="table-scroll mt-2">
          <table className="w-full min-w-[300px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">{t('word.article')}</th>
                <th className="py-2 pr-3 font-medium">{t('word.singular')}</th>
                <th className="py-2 font-medium">{t('word.plural')}</th>
              </tr>
            </thead>
            <tbody>
              {declension.map((row) => (
                <tr key={row.grammaticalCase} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3 text-xs text-muted">
                    {t(grammaticalCaseKey(row.grammaticalCase))}
                  </td>
                  <td className="py-2 pr-3 font-medium">{row.singular}</td>
                  <td className="py-2 text-muted">{row.plural || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
