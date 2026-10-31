/**
 * Горизонтальная карусель карточек слова со scroll-snap на мобильных устройствах (этап 12):
 * - Секции: Значения, Формы, Примеры, Связанные слова, Грамматика.
 * - Карточки шириной ~86vw, листаются пальцем влево-вправо, виден край следующей.
 */
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictExample, LanguageCode, WordCard as WordCardData } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { SectionTitle } from '../ui/SectionTitle';
import { Chips } from './Chips';
import { ExamplesList } from './ExamplesList';
import { FormsSection } from './FormsSection';
import { MeaningList } from './MeaningList';
import { RelatedSection } from './RelatedSection';
import { SourcesLine } from './SourcesLine';

interface WordCarouselProps {
  card: WordCardData;
  speech: SpeechController;
  dictExamples: DictExample[];
  dictLang: LanguageCode | null;
  translationLang: LanguageCode;
  hasForms: boolean;
  hasRelated: boolean;
  hasGrammar: boolean;
  grammarBlock: React.ReactNode;
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  onPickWord?: (value: string) => void;
}

export const WordCarousel = forwardRef<HTMLDivElement, WordCarouselProps>(function WordCarousel(
  {
    card,
    speech,
    dictExamples,
    dictLang,
    translationLang,
    hasForms,
    hasRelated,
    hasGrammar,
    grammarBlock,
    onPickTranslation,
    onPickWord,
  },
  ref,
) {
  const { t } = useTranslation();

  return (
    <div
      ref={ref}
      className="flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar pb-2 pt-1"
      style={{ paddingLeft: '2px', paddingRight: '2px' }}
    >
      {/* 1. Значения */}
      <div
        id="card-dictionary"
        className="shrink-0 w-[86vw] max-w-[360px] snap-center rounded-2xl border border-line bg-card p-4 shadow-sm"
      >
        <SectionTitle>{t('word.tabDictionary')}</SectionTitle>
        <div className="mt-2">
          <MeaningList
            meanings={card.meanings}
            translationLang={translationLang}
            onPickTranslation={onPickTranslation}
            glossary={card.glossary}
          />
        </div>
        {card.governance.length > 0 ? (
          <div className="mt-3 border-t border-line pt-2.5">
            <SectionTitle>{t('word.governance')}</SectionTitle>
            <Chips className="mt-1.5" items={card.governance} onPick={(value) => onPickWord?.(value)} />
          </div>
        ) : null}
        <div className="mt-3 border-t border-line pt-2">
          <SourcesLine sources={card.dictSources ?? []} />
        </div>
      </div>

      {/* 2. Формы */}
      {hasForms ? (
        <div
          id="card-forms"
          className="shrink-0 w-[86vw] max-w-[360px] snap-center rounded-2xl border border-line bg-card p-4 shadow-sm"
        >
          <SectionTitle>{t('word.tabForms')}</SectionTitle>
          <div className="mt-2">
            <FormsSection card={card} speech={speech} />
          </div>
        </div>
      ) : null}

      {/* 3. Примеры */}
      {card.examples.length > 0 || dictExamples.length > 0 ? (
        <div
          id="card-examples"
          className="shrink-0 w-[86vw] max-w-[360px] snap-center rounded-2xl border border-line bg-card p-4 shadow-sm"
        >
          <SectionTitle>{t('word.tabExamples')}</SectionTitle>
          <div className="mt-2">
            <ExamplesList
              card={card}
              speech={speech}
              dictExamples={dictExamples}
              dictLang={dictLang}
              translationLang={translationLang}
            />
          </div>
        </div>
      ) : null}

      {/* 4. Связанные слова */}
      {hasRelated ? (
        <div
          id="card-related"
          className="shrink-0 w-[86vw] max-w-[360px] snap-center rounded-2xl border border-line bg-card p-4 shadow-sm"
        >
          <SectionTitle>{t('word.tabRelated')}</SectionTitle>
          <div className="mt-2">
            <RelatedSection card={card} onPick={onPickWord} />
          </div>
        </div>
      ) : null}

      {/* 5. Грамматика */}
      {hasGrammar ? (
        <div
          id="card-grammar"
          className="shrink-0 w-[86vw] max-w-[360px] snap-center rounded-2xl border border-line bg-card p-4 shadow-sm"
        >
          <SectionTitle>{t('word.tabGrammar')}</SectionTitle>
          <div className="mt-2">{grammarBlock}</div>
        </div>
      ) : null}
    </div>
  );
});
