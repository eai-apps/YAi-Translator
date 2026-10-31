/**
 * «Наборы» (этап 6): восемь готовых тем A1–A2 по 20 слов.
 * Слова сверены по Wiktionary; карточки собираются без запросов к ИИ.
 * Каждый набор раскрывается — можно сначала посмотреть слова.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DeckWord, StudyDeck } from '../../../shared/types';
import { STUDY_DECKS } from '../../../shared/decks';
import { deckTranslation } from '../../../shared/study';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { cardFromDeckWord } from '../../lib/studyCard';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SpeakButton } from '../../components/ui/SpeakButton';
import { IconCheck, IconSparkles } from '../../components/layout/icons';

function DeckWordRow({ word, speech }: { word: DeckWord; speech: ReturnType<typeof useSpeech> }) {
  const { uiLanguage } = useSettings();
  const spoken = word.article ? `${word.article} ${word.lemma}` : word.lemma;

  return (
    <li className="flex items-center gap-2 border-t border-line py-1.5 first:border-t-0">
      <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
        {word.article ? (
          <span className={cn('text-xs font-bold uppercase', ARTICLE_COLORS[word.article])}>{word.article}</span>
        ) : null}
        <span className="truncate text-sm font-medium">{word.lemma}</span>
        <span className="truncate text-xs text-muted">{deckTranslation(word, uiLanguage)}</span>
      </div>
      <SpeakButton text={spoken} language="de" id={`deck-${word.lemma}`} speech={speech} />
    </li>
  );
}

function DeckCard({ deck, speech }: { deck: StudyDeck; speech: ReturnType<typeof useSpeech> }) {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { cards, addCards } = useStudy();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  const known = new Set(cards.map((card) => card.lemma.toLowerCase()));
  const fresh = deck.words.filter((word) => !known.has(word.lemma.toLowerCase()));
  const allAdded = fresh.length === 0;

  const add = () => {
    const count = addCards(deck.words.map((word) => cardFromDeckWord(word, uiLanguage)));
    setAdded(count);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{deck.level}</Badge>
            <h2 className="text-sm font-semibold">{t(deck.titleKey)}</h2>
          </div>
          <p className="mt-1 text-xs text-muted">{t('study.deckWordsCount', { n: deck.words.length })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)}>
            {open ? t('study.deckHide') : t('study.deckPreview')}
          </Button>
          <Button
            size="sm"
            variant={allAdded ? 'secondary' : 'primary'}
            disabled={allAdded}
            icon={allAdded ? <IconCheck className="h-4 w-4" /> : undefined}
            onClick={add}
          >
            {allAdded ? t('study.deckAllAdded') : t('study.deckAdd')}
          </Button>
        </div>
      </div>

      {added !== null ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-success">
          <IconSparkles className="h-3.5 w-3.5" />
          {added > 0 ? t('study.deckAdded', { n: added }) : t('study.deckAllAdded')}
        </p>
      ) : null}

      {open ? (
        <ul className="mt-3 max-h-72 overflow-y-auto pr-1">
          {deck.words.map((word) => (
            <DeckWordRow key={word.lemma} word={word} speech={speech} />
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

export default function DecksPage() {
  const { t } = useTranslation();
  const speech = useSpeech();

  return (
    <>
      <PageHeader title={t('study.decksTitle')} subtitle={t('study.decksSubtitle')} />
      <div className="space-y-3">
        {STUDY_DECKS.map((deck) => (
          <DeckCard key={deck.id} deck={deck} speech={speech} />
        ))}
      </div>
    </>
  );
}
