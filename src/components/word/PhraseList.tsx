/** Устойчивые выражения с переводом. */
import { useTranslation } from 'react-i18next';
import type { Phrase } from '../../../shared/types';
import { SectionTitle } from '../ui/SectionTitle';
import { PickText } from './pick';

export function PhraseList({ phrases }: { phrases: Phrase[] }) {
  const { t } = useTranslation();
  if (phrases.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionTitle>{t('word.phrases')}</SectionTitle>
      <ul className="mt-2 space-y-2">
        {phrases.map((phrase, index) => (
          <li key={`${phrase.text}-${index}`} className="rounded-xl bg-soft px-3 py-2">
            <PickText text={phrase.text} className="text-sm font-medium leading-relaxed" />
            {phrase.translation ? (
              <p className="text-sm leading-relaxed text-muted">{phrase.translation}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
