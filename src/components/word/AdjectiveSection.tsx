/** Прилагательное во вкладке «Формы»: степени сравнения и три таблицы склонения (этап 8). */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { buildComparison, buildDeclension } from '../../lib/adjectiveForms';
import type { AdjectiveDeclension, AdjectiveRow } from '../../lib/adjectiveForms';
import { grammaticalCaseKey } from '../../lib/labels';
import { Segmented } from '../ui/Segmented';
import { SpeakButton } from '../ui/SpeakButton';

interface AdjectiveSectionProps {
  lemma: string;
  speech: SpeechController;
  language: LanguageCode;
}

/** Подписи колонок: род и число. */
const COLUMNS = ['masculine', 'neuter', 'feminine', 'plural'] as const;

function DeclensionTable({ rows }: { rows: AdjectiveRow[] }) {
  const { t } = useTranslation();
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[340px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="py-2 pr-3 font-medium">{t('word.case')}</th>
            {COLUMNS.map((column) => (
              <th key={column} className="py-2 pr-3 font-medium">
                {t(`word.gender.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.grammaticalCase} className="border-b border-line last:border-0">
              <td className="py-1.5 pr-3 text-xs text-muted">{t(grammaticalCaseKey(row.grammaticalCase))}</td>
              {COLUMNS.map((column) => (
                <td key={column} className="py-1.5 pr-3 font-medium">
                  <span className="text-accent">{row[column].text}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdjectiveSection({ lemma, speech, language }: AdjectiveSectionProps) {
  const { t } = useTranslation();
  const [declension, setDeclension] = useState<AdjectiveDeclension>('strong');

  const comparison = useMemo(() => buildComparison(lemma), [lemma]);
  const rows = useMemo(() => buildDeclension(lemma, declension), [lemma, declension]);

  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">{t('word.comparisonTitle')}</h4>
          <SpeakButton
            text={`${comparison.positive}, ${comparison.comparative}, ${comparison.superlative}`}
            language={language}
            id="adjective-comparison"
            speech={speech}
            label={t('common.listen')}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <p>
            <span className="text-xs text-muted">{t('word.comparisonPositive')}: </span>
            <span className="font-medium text-accent">{comparison.positive}</span>
          </p>
          <p>
            <span className="text-xs text-muted">{t('word.comparisonComparative')}: </span>
            <span className="font-medium text-accent">{comparison.comparative}</span>
          </p>
          <p>
            <span className="text-xs text-muted">{t('word.comparisonSuperlative')}: </span>
            <span className="font-medium text-accent">{comparison.superlative}</span>
          </p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('word.comparisonHint')}</p>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">{t('word.declensionTitle')}</h4>
          <Segmented<AdjectiveDeclension>
            ariaLabel={t('word.declensionType')}
            value={declension}
            onChange={setDeclension}
            options={[
              { value: 'weak', label: t('word.declensionWeak') },
              { value: 'mixed', label: t('word.declensionMixed') },
              { value: 'strong', label: t('word.declensionStrong') },
            ]}
          />
        </div>
        <div className="mt-2">
          <DeclensionTable rows={rows} />
        </div>
      </div>
    </section>
  );
}
