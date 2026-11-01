/**
 * Один список «Мои списки» (этап 8Б): слова списка, «Учить этот список» — повторение
 * только этих карточек, упражнения по списку и удаление слов из списка.
 * Слова берутся из «Мои карточки» по id: список хранит только id.
 */
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { StudyCard } from '../../../shared/types';
import { PRACTICE_TYPES, isPracticeType } from '../../../shared/study';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { pickSession } from '../../lib/srs';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { StudyCardRow } from '../../components/study/StudyCardRow';
import { listPracticeLink, listReviewLink } from './ListsPage';
import { IconBookmark, IconDownload } from '../../components/layout/icons';
import { exportListToAnkiCsv } from '../../lib/studyExport';

export default function ListPage() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const speech = useSpeech();
  const { lists, cards, progress, newPerDay, getProgress, removeFromList } = useStudy();
  const list = lists.find((item) => item.id === params.listId) ?? null;

  // Список удалили в другой вкладке — возвращаем к списку списков.
  useEffect(() => {
    if (!list) navigate('/learn/lists', { replace: true });
  }, [list, navigate]);

  // Карточки списка в порядке карточек; прогресс есть только у сохранённых слов.
  const items = useMemo<StudyCard[]>(() => {
    const known = new Map(cards.map((card) => [card.id, card] as const));
    return list ? list.cardIds.flatMap((id) => known.get(id) ?? []) : [];
  }, [list, cards]);
  const available = items;

  const sessionSize = useMemo(
    () => (list ? pickSession(available, progress, { newPerDay }).length : 0),
    [available, progress, newPerDay, list],
  );

  if (!list) return null;

  return (
    <>
      <PageHeader
        title={`${list.emoji ? `${list.emoji} ` : ''}${list.title}`}
        subtitle={t('study.deckWordsCount', { n: available.length })}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={listReviewLink(list.id)}
            className={
              sessionSize > 0
                ? 'inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accentInk'
                : 'pointer-events-none inline-flex h-10 items-center rounded-xl bg-soft px-4 text-sm font-medium text-muted'
            }
          >
            {sessionSize > 0 ? t('study.listReview', { count: sessionSize }) : t('study.reviewEmpty')}
          </Link>
          <Link
            to="/learn/lists"
            className="inline-flex h-10 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-soft"
          >
            {t('study.listsTitle')}
          </Link>
          <Button
            size="sm"
            variant="ghost"
            icon={<IconDownload className="h-4 w-4" />}
            disabled={available.length === 0}
            onClick={() => exportListToAnkiCsv(list, cards)}
          >
            {t('study.exportAnki')}
          </Button>
        </div>

        {/* Упражнения берут только слова этого списка. */}
        <div className="flex flex-wrap gap-1">
          {PRACTICE_TYPES.filter((type) => isPracticeType(type)).map((type) => (
            <Link
              key={type}
              to={listPracticeLink(list.id, type)}
              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent"
            >
              {t(`study.practice${type.charAt(0).toUpperCase()}${type.slice(1)}`)}
            </Link>
          ))}
        </div>

        {available.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              icon={<IconBookmark className="h-6 w-6" />}
              title={t('study.listEmpty')}
              text={t('study.listEmptyText')}
            />
            <div className="flex justify-center pb-4">
              <Button onClick={() => navigate('/')}>{t('study.listAddFromTranslate')}</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {available.map((card) => (
              <StudyCardRow
                key={card.id}
                card={card}
                progress={getProgress(card.id)}
                speech={speech}
                onRemove={() => removeFromList(list.id, card.id)}
                removeLabel={t('study.listRemoveWord')}
                menu
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
