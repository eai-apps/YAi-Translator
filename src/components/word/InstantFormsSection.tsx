/**
 * Секция грамматических форм для карточки слова из базы (этап 15):
 * - Немецкие глаголы: спряжение в Präsens, Präteritum, Perfekt с haben/sein.
 * - Немецкие существительные: таблица склонения по 4 падежам (ед. и мн. число).
 * - Немецкие прилагательные: степени сравнения (Positiv, Komparativ, Superlativ).
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../../shared/types';
import type { ResolvedLexiconEntry } from '../../hooks/useLexicon';
import { grammaticalCaseKey } from '../../lib/labels';
import { buildNounDeclension, buildVerbConjugation, getAdjComparison } from '../../lib/lexiconForms';
import { SectionTitle } from '../ui/SectionTitle';

interface InstantFormsSectionProps {
  lemma: string;
  entry: ResolvedLexiconEntry;
  lang: LanguageCode;
}

export function InstantFormsSection({ lemma, entry, lang }: InstantFormsSectionProps) {
  const { t } = useTranslation();

  if (lang !== 'de') return null;

  // 1. Глагол
  if (entry.pos === 'v') {
    const conj = buildVerbConjugation(lemma, entry);
    return (
      <section className="space-y-2 pt-2 border-t border-line">
        <SectionTitle>{t('word.tabForms')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Präsens */}
          <div className="rounded-xl border border-line bg-card p-2.5 space-y-1">
            <p className="font-semibold text-muted uppercase tracking-wider">{t('word.tensePresent')}</p>
            <div className="space-y-0.5">
              {conj.praesens.map((p) => (
                <div key={p.pronoun} className="flex justify-between">
                  <span className="text-muted">{p.pronoun}</span>
                  <span className="font-medium text-accent">{p.form}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Präteritum & Perfekt */}
          <div className="rounded-xl border border-line bg-card p-2.5 space-y-2">
            <div>
              <p className="font-semibold text-muted uppercase tracking-wider">{t('word.tensePast')}</p>
              <div className="mt-1 space-y-0.5">
                {conj.praeteritum.map((p) => (
                  <div key={p.pronoun} className="flex justify-between">
                    <span className="text-muted">{p.pronoun}</span>
                    <span className="font-medium text-ink">{p.form}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-line pt-1.5 flex justify-between">
              <span className="text-muted font-medium">Perfekt:</span>
              <span className="font-semibold text-accent">{conj.perfekt}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Существительное
  if (entry.pos === 'n') {
    const rows = buildNounDeclension(lemma, entry);
    return (
      <section className="space-y-2 pt-2 border-t border-line">
        <SectionTitle>{t('word.tabForms')}</SectionTitle>
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-xs text-left">
            <thead className="bg-soft text-muted font-semibold border-b border-line">
              <tr>
                <th className="p-2">{t('word.case')}</th>
                <th className="p-2">{t('word.singular')}</th>
                <th className="p-2">{t('word.plural')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.grammaticalCase}>
                  <td className="p-2 font-medium text-muted">{t(grammaticalCaseKey(r.grammaticalCase))}</td>
                  <td className="p-2 font-medium text-accent">{r.singular}</td>
                  <td className="p-2 text-ink">{r.plural}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  // 3. Прилагательное
  if (entry.pos === 'adj') {
    const comp = getAdjComparison(lemma, entry);
    return (
      <section className="space-y-1.5 pt-2 border-t border-line">
        <SectionTitle>{t('word.tabForms')}</SectionTitle>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-xl border border-line bg-card px-3 py-1.5">
            <span className="text-muted">Positiv: </span>
            <span className="font-medium text-ink">{lemma}</span>
          </div>
          <div className="rounded-xl border border-line bg-card px-3 py-1.5">
            <span className="text-muted">Komparativ: </span>
            <span className="font-medium text-accent">{comp.comparative}</span>
          </div>
          <div className="rounded-xl border border-line bg-card px-3 py-1.5">
            <span className="text-muted">Superlativ: </span>
            <span className="font-medium text-accent">{comp.superlative.startsWith('am ') ? comp.superlative : `am ${comp.superlative}`}</span>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
