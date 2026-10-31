/** Глагол во вкладке «Формы»: переключатель настоящее / прошедшее / будущее (этап 8). */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conjugation, LanguageCode, VerbForm, WordCard } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { buildVerbTables } from '../../lib/verbForms';
import type { VerbTense } from '../../lib/verbForms';
import { Segmented } from '../ui/Segmented';
import { SpeakButton } from '../ui/SpeakButton';

interface VerbFormsSectionProps {
  card: WordCard;
  conjugation: Conjugation;
  speech: SpeechController;
}

/** Таблица 6 форм в две колонки: ich/du/er,sie,es — wir/ihr/sie,Sie. */
function FormsGrid({ forms }: { forms: VerbForm[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4">
      {forms.map((form, index) => (
        <p key={`${form.pronoun}-${index}`} className="flex items-baseline gap-1.5 py-0.5 text-sm">
          <span className="shrink-0 text-xs text-muted">{form.pronoun}</span>
          <span className="font-medium text-accent">{form.form}</span>
        </p>
      ))}
    </div>
  );
}

export function VerbFormsSection({ card, conjugation, speech }: VerbFormsSectionProps) {
  const { t } = useTranslation();
  const [tense, setTense] = useState<VerbTense>('present');

  const tables = useMemo(
    () =>
      buildVerbTables({
        infinitive: card.lemma,
        praesens: conjugation.praesens,
        praeteritum: conjugation.praeteritum,
        perfekt: conjugation.perfekt,
        auxiliary: conjugation.auxiliary,
        partizip2: conjugation.partizip2 ?? null,
        konjunktiv2: conjugation.konjunktiv2 ?? [],
        imperativ: conjugation.imperativ ?? null,
      })[tense],
    [card.lemma, conjugation, tense],
  );

  const language: LanguageCode = card.language;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t('word.conjugationTitle')}</h4>
        <Segmented<VerbTense>
          ariaLabel={t('word.tenseLabel')}
          value={tense}
          onChange={setTense}
          options={[
            { value: 'present', label: t('word.tensePresent') },
            { value: 'past', label: t('word.tensePast') },
            { value: 'future', label: t('word.tenseFuture') },
          ]}
        />
      </div>

      <div className="mt-3 space-y-4">
        {tables.map((table, index) => {
          const speakText = table.forms.map((form) => form.form).filter(Boolean).join(', ');
          return (
            <div key={`${table.title}-${index}`} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(table.title)}</p>
                  {table.hint ? (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{t(table.hint)}</p>
                  ) : null}
                </div>
                {speakText ? (
                  <SpeakButton
                    text={speakText}
                    language={language}
                    id={`verb-form-${tense}-${index}`}
                    speech={speech}
                    label={t('common.listen')}
                  />
                ) : null}
              </div>
              <div className="mt-1.5">
                <FormsGrid forms={table.forms} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
