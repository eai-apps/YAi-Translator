/**
 * «Мои карточки» (этап 6): список слов с поиском и фильтрами, удаление,
 * открытие в переводчике, экспорт в CSV и Anki, добавление из избранного.
 * Слова из избранного без артикля догружаются через /api/word по одному, с паузой.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { isDue, localDayKey } from '../../lib/srs';
import { splitArticle, cardFromTranslation, cardFromWord } from '../../lib/studyCard';
import { downloadStudyCards } from '../../lib/studyExport';
import { useHistory } from '../../hooks/useHistory';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { StudyCardRow } from '../../components/study/StudyCardRow';
import { IconBookmark, IconDownload, IconSearch, IconStar } from '../../components/layout/icons';

type Filter = 'today' | 'all' | 'hard';

/** Пауза между запросами карточек из избранного: сервер не должен захлебнуться. */
const IMPORT_DELAY_MS = 300;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function CardsPage() {
  const { t } = useTranslation();
  const { cards, addCard, removeCard, getProgress } = useStudy();
  const { favorites } = useHistory();
  const { uiLanguage } = useSettings();
  const speech = useSpeech();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const shown = useMemo(() => {
    const text = query.trim().toLowerCase();
    return cards
      .filter((card) => {
        const item = getProgress(card.id);
        if (filter === 'hard' && (!item || item.lapses === 0)) return false;
        // Новые слова тоже «на сегодня»: они попадут в ближайшую сессию.
        if (filter === 'today' && item && !isDue(item)) return false;
        if (!text) return true;
        return (
          card.lemma.toLowerCase().includes(text) ||
          card.translations.some((value) => value.toLowerCase().includes(text))
        );
      })
      .sort((left, right) => right.addedAt - left.addedAt);
  }, [cards, filter, getProgress, query]);

  const favoritesToAdd = useMemo(() => {
    // Берём только немецкие слова из 1–3 слов, которых ещё нет в карточках.
    const known = new Set(cards.map((card) => card.lemma.toLowerCase()));
    return favorites.filter((item) => {
      if (item.sourceLang !== 'de') return false;
      const { lemma } = splitArticle(item.text);
      return lemma.split(/\s+/).length <= 3 && !known.has(lemma.toLowerCase());
    });
  }, [cards, favorites]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  /** Добавляет избранные слова: с артиклем — сразу, без артикля — уточняем в словаре. */
  const addFavorites = async () => {
    const list = favoritesToAdd;
    setImporting({ done: 0, total: list.length });
    let added = 0;

    for (let index = 0; index < list.length; index += 1) {
      const item = list[index];
      const { lemma, article } = splitArticle(item.text);
      const quick = cardFromTranslation(item.text, item.translation);
      let saved = Boolean(article) && quick !== null && addCard(quick);

      if (!saved) {
        try {
          const response = await api.word({ word: lemma, sourceLang: 'de', targetLang: uiLanguage });
          const input = cardFromWord(response.card) ?? quick;
          saved = input !== null && addCard(input);
        } catch {
          // Словарь недоступен — просто переходим к следующему слову.
        }
        await wait(IMPORT_DELAY_MS);
      }

      if (saved) added += 1;
      setImporting({ done: index + 1, total: list.length });
    }

    setImporting(null);
    setMessage(t('study.cardsImported', { n: added }));
  };

  const exportCards = (format: 'csv' | 'anki') => {
    downloadStudyCards(shown, format, localDayKey());
  };

  return (
    <>
      <PageHeader title={t('study.cardsTitle', { n: cards.length })} subtitle={t('study.cardsSubtitle')} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('study.cardsSearch')}
              aria-label={t('study.cardsSearch')}
              className="h-11 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <Segmented
            ariaLabel={t('study.cardsFilter')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'today', label: t('study.cardsFilterToday') },
              { value: 'all', label: t('study.cardsFilterAll') },
              { value: 'hard', label: t('study.cardsFilterHard') },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            icon={<IconDownload className="h-4 w-4" />}
            disabled={shown.length === 0}
            onClick={() => exportCards('csv')}
          >
            {t('study.exportCsv')}
          </Button>
          <Button
            size="sm"
            icon={<IconDownload className="h-4 w-4" />}
            disabled={shown.length === 0}
            onClick={() => exportCards('anki')}
          >
            {t('study.exportAnki')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<IconStar className="h-4 w-4" />}
            disabled={favoritesToAdd.length === 0 || importing !== null}
            onClick={() => void addFavorites()}
          >
            {importing
              ? t('study.cardsImportProgress', { done: importing.done, total: importing.total })
              : t('study.cardsImportFavorites', { n: favoritesToAdd.length })}
          </Button>
          {message ? <span className="text-xs text-muted">{message}</span> : null}
        </div>

        {shown.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              icon={<IconBookmark className="h-6 w-6" />}
              title={cards.length === 0 ? t('study.cardsEmpty') : t('study.cardsNoMatch')}
              text={cards.length === 0 ? t('study.cardsEmptyText') : undefined}
            />
            <div className="flex justify-center pb-4">
              <Link
                to="/learn/decks"
                className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accentInk"
              >
                {t('study.tileDecks')}
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {shown.map((card) => (
              <StudyCardRow
                key={card.id}
                card={card}
                progress={getProgress(card.id)}
                speech={speech}
                onRemove={() => removeCard(card.id)}
              />
            ))}
          </div>
        )}

        {cards.length > 0 ? (
          <p className="text-center text-xs text-muted">
            {t('study.cardsShown', { shown: shown.length, total: cards.length })}
          </p>
        ) : null}
      </div>
    </>
  );
}
