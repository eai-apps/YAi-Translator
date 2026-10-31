/** Карточка слова: артикль с цветом, значения, склонение, спряжение, примеры. */
import { useTranslation } from 'react-i18next';
import type { DictExample, LanguageCode, WordCard as WordCardData } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { partOfSpeechKey } from '../../lib/labels';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';
import { GrammarLinkedInline } from '../grammar/GrammarLinkedText';
import { GrammarTopicLinks } from '../grammar/GrammarTopicLinks';
import { ChipList } from './ChipList';
import { ExamplesList } from './ExamplesList';
import { MeaningList } from './MeaningList';
import { NounSection } from './NounSection';
import { PhraseList } from './PhraseList';
import { SourcesLine } from './SourcesLine';
import { VerbSection } from './VerbSection';

interface WordCardProps {
  card: WordCardData;
  speech: SpeechController;
  /** Примеры «Из жизни» (Tatoeba) — вкладка в блоке примеров. */
  dictExamples?: DictExample[];
  /** Язык исходного слова — для примеров из словарей. */
  dictLang?: LanguageCode | null;
}

export function WordCard({ card, speech, dictExamples = [], dictLang = null }: WordCardProps) {
  const { t } = useTranslation();
  const hasTranslation = card.meanings.length > 0;

  return (
    <article className="animate-fade-in">
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {card.article ? (
          <span
            className={cn('text-base font-bold uppercase tracking-wide', ARTICLE_COLORS[card.article])}
          >
            {card.article}
          </span>
        ) : null}
        <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {card.lemma}
        </h2>
        <Badge>{t(partOfSpeechKey(card.partOfSpeech))}</Badge>
        {card.transcription ? (
          <span className="text-sm text-muted">{card.transcription}</span>
        ) : null}
      </header>

      {hasTranslation ? <MeaningList meanings={card.meanings} /> : null}

      <NounSection article={card.article} plural={card.plural} declension={card.declension} />

      {card.conjugation ? <VerbSection conjugation={card.conjugation} /> : null}

      {card.grammarNotes.length > 0 ? (
        <section className="mt-5">
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
          <GrammarTopicLinks topics={card.grammarTopics ?? []} />
        </section>
      ) : null}

      {card.governance.length > 0 ? (
        <section className="mt-5">
          <SectionTitle>{t('word.governance')}</SectionTitle>
          <ChipList items={card.governance} />
        </section>
      ) : null}

      <ExamplesList
        examples={card.examples}
        language={card.language}
        speech={speech}
        dictExamples={dictExamples}
        dictLang={dictLang}
      />

      {card.synonyms.length > 0 || card.antonyms.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {card.synonyms.length > 0 ? (
            <section>
              <SectionTitle>{t('word.synonyms')}</SectionTitle>
              <ChipList items={card.synonyms} />
            </section>
          ) : null}
          {card.antonyms.length > 0 ? (
            <section>
              <SectionTitle>{t('word.antonyms')}</SectionTitle>
              <ChipList items={card.antonyms} tone="danger" />
            </section>
          ) : null}
        </div>
      ) : null}

      <PhraseList phrases={card.phrases} />

      {/* Откуда дополнены синонимы и примеры (этап 4). */}
      <SourcesLine sources={card.dictSources ?? []} />
    </article>
  );
}
