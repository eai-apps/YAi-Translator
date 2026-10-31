/**
 * Примеры предложений по уровням: кнопки A1 / A2 / B1 / B2 переключают сложность,
 * отдельная вкладка «Из жизни» показывает настоящие предложения из Tatoeba (этап 4).
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CefrLevel, DictExample, LanguageCode, WordExample } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { CEFR_LEVELS } from '../../lib/labels';
import { Segmented } from '../ui/Segmented';
import { SectionTitle } from '../ui/SectionTitle';
import { PickText } from './pick';
import { SpeakButton } from '../ui/SpeakButton';

interface ExamplesListProps {
  examples: WordExample[];
  language: LanguageCode;
  speech: SpeechController;
  /** Настоящие примеры из словарей — вкладка «Из жизни». */
  dictExamples?: DictExample[];
  /** Язык примеров из словарей (может не совпадать с языком карточки). */
  dictLang?: LanguageCode | null;
}

/** Значение вкладки: уровень CEFR или «из жизни». */
type ExampleTab = CefrLevel | 'life';

export function ExamplesList({ examples, language, speech, dictExamples = [], dictLang }: ExamplesListProps) {
  const { t } = useTranslation();
  // Показываем только те уровни, для которых есть примеры.
  const levels = useMemo(
    () => CEFR_LEVELS.filter((level) => examples.some((example) => example.level === level)),
    [examples],
  );
  const [selected, setSelected] = useState<ExampleTab | null>(null);

  const options: Array<{ value: ExampleTab; label: string }> = [
    ...levels.map((level) => ({ value: level as ExampleTab, label: level })),
    ...(dictExamples.length > 0 ? [{ value: 'life' as ExampleTab, label: t('dict.fromLife') }] : []),
  ];
  if (options.length === 0) return null;

  // Выбранная вкладка могла исчезнуть (новое слово) — тогда первая доступная.
  const active = selected && options.some((option) => option.value === selected) ? selected : options[0].value;
  const visible = active === 'life' ? [] : examples.filter((example) => example.level === active);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{t('word.examples')}</SectionTitle>
        {options.length > 1 ? (
          <Segmented<ExampleTab>
            ariaLabel={t('word.examplesLevel')}
            value={active}
            onChange={setSelected}
            options={options}
          />
        ) : null}
      </div>

      {active === 'life' ? (
        <ul className="mt-2 space-y-2">
          {dictExamples.map((example, index) => (
            <li key={`life-${index}`} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p dir={textDirection(dictLang ?? language)} className="text-sm font-medium leading-relaxed">
                    <PickText text={example.text} />
                  </p>
                  {example.translation ? (
                    <p
                      dir={example.translationLang ? textDirection(example.translationLang) : 'auto'}
                      className="mt-0.5 text-sm leading-relaxed text-muted"
                    >
                      {example.translation}
                    </p>
                  ) : null}
                  <a
                    href={example.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[11px] text-muted underline decoration-dotted underline-offset-2 hover:text-ink"
                  >
                    {example.source === 'tatoeba' ? t('dict.fromTatoeba') : t('dict.fromWiktionary')}
                  </a>
                </div>
                <SpeakButton
                  text={example.text}
                  language={dictLang ?? language}
                  id={`life-${index}`}
                  speech={speech}
                  label={t('common.listen')}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-2 space-y-2">
          {visible.map((example, index) => (
            <li key={`${example.level}-${index}`} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p dir={textDirection(language)} className="text-sm font-medium leading-relaxed">
                    <PickText text={example.text} />
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
      )}
    </section>
  );
}
