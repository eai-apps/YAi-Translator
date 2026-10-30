/** Примеры предложений по уровням A1–B2 с переводом и озвучкой. */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordExample } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';

interface ExamplesListProps {
  examples: WordExample[];
  language: LanguageCode;
  speech: SpeechController;
}

export function ExamplesList({ examples, language, speech }: ExamplesListProps) {
  const { t } = useTranslation();
  if (examples.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionTitle>{t('word.examples')}</SectionTitle>
      <ul className="mt-2 space-y-2">
        {examples.map((example, index) => (
          <li
            key={`${example.level}-${index}`}
            className="rounded-xl border border-line px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-relaxed">{example.text}</p>
                {example.translation ? (
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {example.translation}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge tone="accent">{example.level}</Badge>
                <SpeakButton
                  text={example.text}
                  language={language}
                  id={`example-${index}`}
                  speech={speech}
                  label={t('common.listen')}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
