/** Примеры предложений по уровням: кнопки A2 / B1 / B2 переключают сложность. */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CefrLevel, LanguageCode, WordExample } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { CEFR_LEVELS } from '../../lib/labels';
import { Segmented } from '../ui/Segmented';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';

interface ExamplesListProps {
  examples: WordExample[];
  language: LanguageCode;
  speech: SpeechController;
}

export function ExamplesList({ examples, language, speech }: ExamplesListProps) {
  const { t } = useTranslation();
  // Показываем только те уровни, для которых есть примеры.
  const levels = useMemo(
    () => CEFR_LEVELS.filter((level) => examples.some((example) => example.level === level)),
    [examples],
  );
  const [selected, setSelected] = useState<CefrLevel | null>(null);
  const level = selected && levels.includes(selected) ? selected : levels[0];
  if (!level) return null;

  const visible = examples.filter((example) => example.level === level);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{t('word.examples')}</SectionTitle>
        {levels.length > 1 ? (
          <Segmented<CefrLevel>
            ariaLabel={t('word.examplesLevel')}
            value={level}
            onChange={setSelected}
            options={levels.map((value) => ({ value, label: value }))}
          />
        ) : null}
      </div>
      <ul className="mt-2 space-y-2">
        {visible.map((example, index) => (
          <li key={`${example.level}-${index}`} className="rounded-xl border border-line px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p dir={textDirection(language)} className="text-sm font-medium leading-relaxed">
                  {example.text}
                </p>
                {example.translation ? (
                  <p dir="auto" className="mt-0.5 text-sm leading-relaxed text-muted">
                    {example.translation}
                  </p>
                ) : null}
              </div>
              <SpeakButton
                text={example.text}
                language={language}
                id={`example-${example.level}-${index}`}
                speech={speech}
                label={t('common.listen')}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
