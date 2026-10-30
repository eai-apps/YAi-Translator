/** Глагол: Präsens, Präteritum, Perfekt и вспомогательный глагол. */
import { useTranslation } from 'react-i18next';
import type { Conjugation, VerbForm } from '../../../shared/types';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';

function FormsTable({ forms }: { forms: VerbForm[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {forms.map((form, index) => (
          <tr key={`${form.pronoun}-${index}`} className="border-b border-line last:border-0">
            <td className="w-24 py-1.5 pr-2 text-xs text-muted">{form.pronoun}</td>
            <td className="py-1.5 font-medium">{form.form}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function VerbSection({ conjugation }: { conjugation: Conjugation }) {
  const { t } = useTranslation();

  return (
    <section className="mt-5">
      <SectionTitle>{t('word.conjugation')}</SectionTitle>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold text-accent">{t('word.praesens')}</p>
          <FormsTable forms={conjugation.praesens} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-accent">{t('word.praeteritum')}</p>
          <FormsTable forms={conjugation.praeteritum} />
        </div>
      </div>

      {conjugation.perfekt ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-soft px-3 py-2 text-sm">
          <span className="text-muted">{t('word.perfekt')}:</span>
          <span className="font-medium">{conjugation.perfekt}</span>
          <Badge>{conjugation.auxiliary}</Badge>
        </div>
      ) : null}
    </section>
  );
}
