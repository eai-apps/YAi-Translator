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
import { getCefrLevel } from '../../../shared/lexicon';
import type { SpeechController } from '../../hooks/useSpeech';
import { useLexicon } from '../../hooks/useLexicon';
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
  const { match: lexMatch } = useLexicon(card.lemma, card.language);

  const cefrLevel = card.cefrLevel || (lexMatch ? getCefrLevel(lexMatch.entry.fr) : null);
  const audioUrl = card.audioUrl || lexMatch?.entry.audio || undefined;

  const currentCard = useMemo(() => {
    let syns = card.synonyms;
    if (syns.length === 0 && lexMatch?.entry.syn?.length) {
      syns = lexMatch.entry.syn;
    }
    return {
      ...card,
      cefrLevel,
      audioUrl: audioUrl || null,
      synonyms: syns,
    };
  }, [card, cefrLevel, audioUrl, lexMatch]);

  const studyInput = useMemo(() => cardFromWord(currentCard), [currentCard]);

  const hasGrammar =
    (currentCard.grammar ?? []).length > 0 || currentCard.grammarNotes.length > 0 || (currentCard.grammarTopics ?? []).length > 0;
  const hasForms =
    Boolean(currentCard.conjugation) || Boolean(currentCard.declension) || Boolean(currentCard.plural) || currentCard.partOfSpeech === 'adjective';
  const hasRelated =
    currentCard.synonyms.length > 0 ||
    currentCard.antonyms.length > 0 ||
    (currentCard.family ?? []).length > 0 ||
    currentCard.governance.length > 0 ||
    currentCard.phrases.length > 0;

  const available: CardTab<TabId>[] = [
    { id: 'all', label: t('word.tabAll') },
    { id: 'dictionary', label: t('word.tabDictionary') },
    ...(hasForms ? [{ id: 'forms' as TabId, label: t('word.tabForms') }] : []),
    ...(currentCard.examples.length > 0 || dictExamples.length > 0
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

  const grammarBlock = <GrammarSection card={currentCard} speech={speech} translationLang={lang} />;

  return (
    <article className="animate-fade-in select-text">
      <WordCardHeader
        card={currentCard}
        menu={headerMenu}
        speak={
          <SpeakButton
            text={currentCard.lemma}
            language={currentCard.language}
            id={`card-${currentCard.lemma}`}
            speech={speech}
            audioUrl={audioUrl}
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
          card={currentCard}
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
              <MeaningList meanings={currentCard.meanings} translationLang={lang} onPickTranslation={onPickTranslation} glossary={currentCard.glossary} />
            </div>
            {currentCard.examples.length > 0 || dictExamples.length > 0 ? (
              <ExamplesList
                card={currentCard}
                speech={speech}
                dictExamples={dictExamples}
                dictLang={dictLang}
                translationLang={lang}
              />
            ) : null}
            {hasForms ? <FormsSection card={currentCard} speech={speech} /> : null}
            {hasRelated ? <RelatedSection card={currentCard} onPick={pick ?? undefined} /> : null}
            {hasGrammar ? grammarBlock : null}
            <SourcesLine sources={currentCard.dictSources ?? []} />
          </div>
        ) : null}

        {active === 'dictionary' ? (
          <div>
            <MeaningList
              meanings={currentCard.meanings}
              translationLang={lang}
              onPickTranslation={onPickTranslation}
              glossary={currentCard.glossary}
            />
            <SourcesLine sources={currentCard.dictSources ?? []} />
          </div>
        ) : null}

        {active === 'examples' ? (
          <ExamplesList
            card={currentCard}
            speech={speech}
            dictExamples={dictExamples}
            dictLang={dictLang}
            translationLang={lang}
          />
        ) : null}

        {active === 'forms' ? <FormsSection card={currentCard} speech={speech} /> : null}

        {active === 'related' ? (
          <RelatedSection card={currentCard} onPick={pick ?? undefined} />
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
