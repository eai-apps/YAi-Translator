/**
 * «Готовые наборы» (этап 6, часть 16):
 * Темы A1–B1 для немецкого и английского языков + Топ-500 слов.
 * Фильтры по языку и уровню, прогресс изучения набора, кнопка «Учить»
 * с автоматическим добавлением в «Мои колоды» и переходом к повторению.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DeckWord, StudyDeck } from '../../../shared/types';
import type { LanguageCode } from '../../../shared/languages';
import { STUDY_DECKS } from '../../../shared/decks';
import { deckTranslation, studyCardId } from '../../../shared/study';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { cardFromDeckWord } from '../../lib/studyCard';
import { makeList } from '../../lib/studyLists';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SpeakButton } from '../../components/ui/SpeakButton';
import { IconDownload, IconSparkles } from '../../components/layout/icons';
import { exportDeckToAnkiCsv } from '../../lib/studyExport';

type LangFilter = 'all' | 'de' | 'en';
type LevelFilter = 'all' | 'A1' | 'A2' | 'B1';

function DeckWordRow({
  word,
  deckLang,
  speech,
}: {
  word: DeckWord;
  deckLang: LanguageCode;
  speech: ReturnType<typeof useSpeech>;
}) {
  const { uiLanguage } = useSettings();
  const spoken = word.article ? `${word.article} ${word.lemma}` : word.lemma;
  const lang = word.lang || deckLang || 'de';

  return (
    <li className="flex items-center gap-2 border-t border-line py-1.5 first:border-t-0">
      <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
        {word.article ? (
          <span className={cn('text-xs font-bold uppercase', ARTICLE_COLORS[word.article])}>
            {word.article}
          </span>
        ) : null}
        <span className="truncate text-sm font-medium">{word.lemma}</span>
        <span className="truncate text-xs text-muted">{deckTranslation(word, uiLanguage)}</span>
      </div>
      <SpeakButton text={spoken} language={lang} id={`deck-${lang}-${word.lemma}`} speech={speech} />
    </li>
  );
}

function DeckCard({ deck, speech }: { deck: StudyDeck; speech: ReturnType<typeof useSpeech> }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uiLanguage } = useSettings();
  const { cards, progress, lists, addCards, createList, addToList } = useStudy();
  const [open, setOpen] = useState(false);
  const [addedNote, setAddedNote] = useState<number | null>(null);

  const deckLang: LanguageCode = deck.lang || 'de';
  const listId = `deck-${deck.id}`;

  // Проверяем наличие слов набора в моих карточках
  const existingCardsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of cards) {
      if (card.lang === deckLang) {
        map.set(card.lemma.toLowerCase(), card.id);
      }
    }
    return map;
  }, [cards, deckLang]);

  const progressById = useMemo(() => {
    const map = new Map<string, (typeof progress)[0]>();
    for (const p of progress) map.set(p.cardId, p);
    return map;
  }, [progress]);

  // Подсчёт прогресса
  const totalCount = deck.words.length;
  let addedCount = 0;
  let learnedCount = 0;

  for (const word of deck.words) {
    const cardId = existingCardsMap.get(word.lemma.toLowerCase());
    if (cardId) {
      addedCount += 1;
      const prog = progressById.get(cardId);
      if (prog && (prog.interval >= 7 || prog.reps >= 3)) {
        learnedCount += 1;
      }
    }
  }

  const allAdded = addedCount >= totalCount;
  const percentLearned = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;
  const isDeckInMyLists = lists.some((l) => l.id === listId || l.title === t(deck.titleKey));

  // Добавление в колоды
  const ensureAdded = () => {
    const freshWords = deck.words.filter(
      (w) => !existingCardsMap.has(w.lemma.toLowerCase()),
    );
    let count = 0;
    if (freshWords.length > 0) {
      count = addCards(freshWords.map((word) => cardFromDeckWord(word, uiLanguage, deck)));
    }

    // Создаём или обновляем список в «Моих колодах»
    const cardIds = deck.words.map((w) => studyCardId(w.lemma, deckLang));
    const existingList = lists.find((l) => l.id === listId || l.title === t(deck.titleKey));
    if (!existingList) {
      const emoji = deckLang === 'en' ? '🇬🇧' : '🇩🇪';
      const newList = makeList(t(deck.titleKey), emoji);
      if (newList) {
        newList.id = listId;
        newList.cardIds = cardIds;
        createList(newList);
      }
    } else {
      addToList(cardIds, existingList.id);
    }

    return count;
  };

  const handleAdd = () => {
    const count = ensureAdded();
    setAddedNote(count);
  };

  const handleLearn = () => {
    ensureAdded();
    navigate(`/learn/review?list=${encodeURIComponent(listId)}`);
  };

  const flag = deckLang === 'en' ? '🇬🇧' : '🇩🇪';

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base" role="img" aria-label={deckLang}>
              {flag}
            </span>
            <Badge tone="accent">{deck.level}</Badge>
            <h2 className="text-sm font-semibold">{t(deck.titleKey)}</h2>
            {isDeckInMyLists ? (
              <Badge tone="neutral" className="text-[10px]">
                {t('study.inMyDecks')}
              </Badge>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{t('study.deckWordsCount', { n: totalCount })}</span>
            {addedCount > 0 ? (
              <span>
                {t('study.deckLearnedProgress', {
                  learned: learnedCount,
                  total: totalCount,
                  percent: percentLearned,
                })}
              </span>
            ) : null}
          </div>

          {/* Полоса прогресса изучения набора */}
          {addedCount > 0 ? (
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${percentLearned}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            size="sm"
            variant="ghost"
            icon={<IconDownload className="h-3.5 w-3.5" />}
            title={t('study.exportAnki')}
            onClick={() => exportDeckToAnkiCsv(deck, uiLanguage)}
          >
            Anki
          </Button>

          <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)}>
            {open ? t('study.deckHide') : t('study.deckPreview')}
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<IconSparkles className="h-3.5 w-3.5" />}
            onClick={handleLearn}
          >
            {t('study.deckLearn')}
          </Button>

          {!allAdded ? (
            <Button size="sm" variant="secondary" onClick={handleAdd}>
              {t('study.deckAdd')}
            </Button>
          ) : null}
        </div>
      </div>

      {addedNote !== null ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-success">
          <IconSparkles className="h-3.5 w-3.5" />
          {addedNote > 0 ? t('study.deckAdded', { n: addedNote }) : t('study.deckAllAdded')}
        </p>
      ) : null}

      {open ? (
        <ul className="mt-3 max-h-72 overflow-y-auto pr-1">
          {deck.words.map((word) => (
            <DeckWordRow key={`${deckLang}-${word.lemma}`} word={word} deckLang={deckLang} speech={speech} />
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

export default function DecksPage() {
  const { t } = useTranslation();
  const speech = useSpeech();
  const [langFilter, setLangFilter] = useState<LangFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  const filteredDecks = useMemo(() => {
    return STUDY_DECKS.filter((deck) => {
      const dLang = deck.lang || 'de';
      if (langFilter !== 'all' && dLang !== langFilter) return false;
      if (levelFilter !== 'all' && deck.level !== levelFilter) return false;
      return true;
    });
  }, [langFilter, levelFilter]);

  return (
    <>
      <PageHeader title={t('study.decksTitle')} subtitle={t('study.decksSubtitle')} />

      {/* Фильтры по языку и уровню */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLangFilter('all')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              langFilter === 'all'
                ? 'bg-accent text-accentInk'
                : 'border border-line bg-card text-ink hover:bg-soft',
            )}
          >
            {t('study.filterAllLangs')}
          </button>
          <button
            type="button"
            onClick={() => setLangFilter('de')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              langFilter === 'de'
                ? 'bg-accent text-accentInk'
                : 'border border-line bg-card text-ink hover:bg-soft',
            )}
          >
            🇩🇪 Deutsch
          </button>
          <button
            type="button"
            onClick={() => setLangFilter('en')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              langFilter === 'en'
                ? 'bg-accent text-accentInk'
                : 'border border-line bg-card text-ink hover:bg-soft',
            )}
          >
            🇬🇧 English
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'A1', 'A2', 'B1'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'rounded-xl px-2.5 py-1 text-xs font-medium transition-colors',
                levelFilter === lvl
                  ? 'bg-accentSoft text-accent font-semibold'
                  : 'text-muted hover:bg-soft hover:text-ink',
              )}
            >
              {lvl === 'all' ? t('study.filterAllLevels') : lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredDecks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} speech={speech} />
        ))}
      </div>
    </>
  );
}
