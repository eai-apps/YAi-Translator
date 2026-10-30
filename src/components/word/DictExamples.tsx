/**
 * Примеры «Из жизни» — настоящие предложения из корпуса Tatoeba и Wiktionary.
 * У каждого примера подпись источника и ссылка (Tatoeba — лицензия CC BY 2.0 FR, Wiktionary — CC BY-SA).
 */
import { useTranslation } from 'react-i18next';
import type { DictExample, LanguageCode } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';

interface DictExamplesProps {
  examples: DictExample[];
  language: LanguageCode;
  speech: SpeechController;
}

export function DictExamples({ examples, language, speech }: DictExamplesProps) {
  const { t } = useTranslation();
  if (examples.length === 0) return null;

  // Заголовок раздела нужен только когда блок стоит отдельно (без вкладок «Примеры»).
  return (
    <section className="mt-6 first:mt-2">
      <SectionTitle>{t('dict.fromLife')}</SectionTitle>
      <ul className="mt-2 space-y-2">
        {examples.map((example, index) => (
          <li key={`${example.source}-${index}`} className="rounded-xl border border-line px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p dir={textDirection(language)} className="text-sm font-medium leading-relaxed">
                  {example.text}
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
                language={language}
                id={`dict-example-${index}`}
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
