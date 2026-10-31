/**
 * Карточка слова с вкладками и горизонтальной лентой карточек (этап 12):
 * - На мобильном: горизонтальная карусель карточек со scroll-snap (WordCarousel),
 *   листается влево-вправо, виден край следующей.
 * - На десктопе: классические вкладки-пилюли с полным или детальным просмотром.
 */
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { DictExample, LanguageCode, WordCard as WordCardData } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { cardFromWord } from '../../lib/studyCard';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';
import { AddToStudyMenu } from '../study/AddToStudyMenu';
import { CardTabs } from './CardTabs';
import type { CardTab } from './CardTabs';
import { Chips } from './Chips';
import { ExamplesList } from './ExamplesList';
import { FormsSection } from './FormsSection';
import { GrammarSection } from './GrammarSection';
import { MeaningList } from './MeaningList';
import { RelatedSection } from './RelatedSection';
import { SourcesLine } from './SourcesLine';
import { WordCarousel } from './WordCarousel';
import { usePick } from './pick';
import { WordCardHeader } from './WordCardHeader';
import { hapticImpact } from '../../lib/haptics';

type TabId = 'all' | 'dictionary' | 'examples' | 'forms' | 'related' | 'grammar';

interface WordCardProps {
  card: WordCardData;
  speech: SpeechController;
  dictExamples?: DictExample[];
  dictLang?: LanguageCode | null;
  translationLang?: LanguageCode;
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  headerMenu?: ReactNode;
}

export function WordCard({
  card,
  speech,
  dictExamples = [],
  dictLang = null,
  translationLang,
  onPickTranslation,
  headerMenu,
}: WordCardProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('all');
  const carouselRef = useRef<HTMLDivElement>(null);
  const pick = usePick();
  const studyInput = useMemo(() => cardFromWord(card), [card]);

  const hasGrammar =
    (card.grammar ?? []).length > 0 || card.grammarNotes.length > 0 || (card.grammarTopics ?? []).length > 0;
  const hasForms =
    Boolean(card.conjugation) || Boolean(card.declension) || Boolean(card.plural) || card.partOfSpeech === 'adjective';
  const hasRelated =
    card.synonyms.length > 0 ||
    card.antonyms.length > 0 ||
    (card.family ?? []).length > 0 ||
    card.governance.length > 0 ||
    card.phrases.length > 0;

  const available: CardTab<TabId>[] = [
    { id: 'all', label: t('word.tabAll') },
    { id: 'dictionary', label: t('word.tabDictionary') },
    ...(hasForms ? [{ id: 'forms' as TabId, label: t('word.tabForms') }] : []),
    ...(card.examples.length > 0 || dictExamples.length > 0
      ? [{ id: 'examples' as TabId, label: t('word.tabExamples') }]
      : []),
    ...(hasRelated ? [{ id: 'related' as TabId, label: t('word.tabRelated') }] : []),
    ...(hasGrammar ? [{ id: 'grammar' as TabId, label: t('word.tabGrammar') }] : []),
  ];

  const active = available.some((item) => item.id === tab) ? tab : available[0].id;
  const lang = translationLang ?? 'ru';

  const handleTabChange = (newTab: TabId) => {
    void hapticImpact();
    setTab(newTab);
    if (newTab !== 'all' && carouselRef.current) {
      const target = carouselRef.current.querySelector(`#card-${newTab}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  const grammarBlock = <GrammarSection card={card} speech={speech} translationLang={lang} />;

  return (
    <article className="animate-fade-in select-text">
      <WordCardHeader
        card={card}
        menu={headerMenu}
        speak={
          <SpeakButton
            text={card.lemma}
            language={card.language}
            id={`card-${card.lemma}`}
            speech={speech}
            label={t('common.listen')}
          />
        }
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <AddToStudyMenu input={studyInput} />
      </div>

      <div className="mt-3">
        <CardTabs tabs={available} value={active} onChange={handleTabChange} />
      </div>

      {/* Мобильный: горизонтальная лента карточек со scroll-snap */}
      <div className="lg:hidden mt-3">
        <WordCarousel
          ref={carouselRef}
          card={card}
          speech={speech}
          dictExamples={dictExamples}
          dictLang={dictLang}
          translationLang={lang}
          hasForms={hasForms}
          hasRelated={hasRelated}
          hasGrammar={hasGrammar}
          grammarBlock={grammarBlock}
          onPickTranslation={onPickTranslation}
          onPickWord={pick ?? undefined}
        />
      </div>

      {/* Десктоп: обычные вкладки и полный столбик (≥1024px) */}
      <div className="hidden lg:block mt-3">
        {active === 'all' ? (
          <div className="space-y-6">
            <div>
              <SectionTitle>{t('word.tabDictionary')}</SectionTitle>
              <MeaningList meanings={card.meanings} translationLang={lang} onPickTranslation={onPickTranslation} glossary={card.glossary} />
            </div>
            {card.examples.length > 0 || dictExamples.length > 0 ? (
              <ExamplesList
                card={card}
                speech={speech}
                dictExamples={dictExamples}
                dictLang={dictLang}
                translationLang={lang}
              />
            ) : null}
            {hasForms ? <FormsSection card={card} speech={speech} /> : null}
            {hasRelated ? <RelatedSection card={card} onPick={pick ?? undefined} /> : null}
            {hasGrammar ? grammarBlock : null}
            <SourcesLine sources={card.dictSources ?? []} />
          </div>
        ) : null}

        {active === 'dictionary' ? (
          <div>
            <MeaningList
              meanings={card.meanings}
              translationLang={lang}
              onPickTranslation={onPickTranslation}
              glossary={card.glossary}
            />
            <SourcesLine sources={card.dictSources ?? []} />
          </div>
        ) : null}

        {active === 'examples' ? (
          <ExamplesList
            card={card}
            speech={speech}
            dictExamples={dictExamples}
            dictLang={dictLang}
            translationLang={lang}
          />
        ) : null}

        {active === 'forms' ? <FormsSection card={card} speech={speech} /> : null}

        {active === 'related' ? (
          <RelatedSection card={card} onPick={pick ?? undefined} />
        ) : null}

        {active === 'grammar' ? grammarBlock : null}
      </div>

      {/* Управление предлогами — на десктопе */}
      {card.governance.length > 0 && active !== 'related' && active !== 'all' ? (
        <div className="hidden lg:block mt-4">
          <SectionTitle>{t('word.governance')}</SectionTitle>
          <Chips className="mt-1.5" items={card.governance} onPick={(value) => pick?.(value)} />
        </div>
      ) : null}
    </article>
  );
}
