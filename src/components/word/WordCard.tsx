/**
 * Карточка слова с вкладками (этап 8): заголовок с главными формами и вкладки-пилюли
 * «Словарь · Примеры · Формы · Связанные слова (+ Грамматика)». Выбранная вкладка запоминается
 * до следующего слова; вкладки прилипают к верху при прокрутке.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { DictExample, LanguageCode, WordCard as WordCardData } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { cardFromWord } from '../../lib/studyCard';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';
import { GrammarLinkedInline } from '../grammar/GrammarLinkedText';
import { GrammarTopicLinks } from '../grammar/GrammarTopicLinks';
import { AddToCardsButton } from '../study/AddToCardsButton';
import { CardTabs } from './CardTabs';
import type { CardTab } from './CardTabs';
import { Chips } from './Chips';
import { ExamplesList } from './ExamplesList';
import { FormsSection } from './FormsSection';
import { MeaningList } from './MeaningList';
import { RelatedSection } from './RelatedSection';
import { SourcesLine } from './SourcesLine';
import { usePick } from './pick';
import { WordCardHeader } from './WordCardHeader';

type TabId = 'dictionary' | 'examples' | 'forms' | 'related' | 'grammar';

interface WordCardProps {
  card: WordCardData;
  speech: SpeechController;
  /** Примеры «Из жизни» (Tatoeba) — во вкладке «Примеры». */
  dictExamples?: DictExample[];
  /** Язык исходного слова — для примеров из словарей. */
  dictLang?: LanguageCode | null;
  /** Язык переводов карточки (обычно — цель перевода). */
  translationLang?: LanguageCode;
  /** Нажатие на перевод значения: перевести обратно (страница перевода). */
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  /** «⋯» в заголовке: меню «Разобрать», «Проверить». */
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
  const [tab, setTab] = useState<TabId>('dictionary');
  const pick = usePick();
  const studyInput = useMemo(() => cardFromWord(card), [card]);

  const hasGrammar = card.grammarNotes.length > 0 || (card.grammarTopics ?? []).length > 0;
  const hasForms =
    Boolean(card.conjugation) || Boolean(card.declension) || Boolean(card.plural) || card.partOfSpeech === 'adjective';
  const hasRelated =
    card.synonyms.length > 0 ||
    card.antonyms.length > 0 ||
    (card.family ?? []).length > 0 ||
    card.governance.length > 0 ||
    card.phrases.length > 0;

  const available: CardTab<TabId>[] = [
    { id: 'dictionary', label: t('word.tabDictionary') },
    ...(card.examples.length > 0 || dictExamples.length > 0
      ? [{ id: 'examples' as TabId, label: t('word.tabExamples') }]
      : []),
    ...(hasForms ? [{ id: 'forms' as TabId, label: t('word.tabForms') }] : []),
    ...(hasRelated ? [{ id: 'related' as TabId, label: t('word.tabRelated') }] : []),
    ...(hasGrammar ? [{ id: 'grammar' as TabId, label: t('word.tabGrammar') }] : []),
  ];
  // Вкладка могла исчезнуть у нового слова — тогда первая доступная.
  const active = available.some((item) => item.id === tab) ? tab : available[0].id;
  const lang = translationLang ?? 'ru';

  return (
    <article className="animate-fade-in">
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
        <AddToCardsButton input={studyInput} />
      </div>

      <div className="mt-3">
        <CardTabs tabs={available} value={active} onChange={setTab} />
      </div>

      <div className="mt-3">
        {active === 'dictionary' ? (
          <div>
            <MeaningList
              meanings={card.meanings}
              translationLang={lang}
              onPickTranslation={onPickTranslation}
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

        {active === 'grammar' ? (
          <section>
            {card.grammarNotes.length > 0 ? (
              <>
                <SectionTitle>{t('word.grammarNotes')}</SectionTitle>
                {/* Названия тем в пояснениях — ссылки на справочник грамматики (этап 5). */}
                <ul className="mt-2 space-y-1.5">
                  {card.grammarNotes.map((note, index) => (
                    <li key={index} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>
                        <GrammarLinkedInline text={note} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <GrammarTopicLinks topics={card.grammarTopics ?? []} />
          </section>
        ) : null}
      </div>

      {/* Управление предлогами — короткая строка под вкладками, как в словаре. */}
      {card.governance.length > 0 && active !== 'related' ? (
        <div className="mt-4">
          <SectionTitle>{t('word.governance')}</SectionTitle>
          <Chips className="mt-1.5" items={card.governance} onPick={(value) => pick?.(value)} />
        </div>
      ) : null}
    </article>
  );
}
