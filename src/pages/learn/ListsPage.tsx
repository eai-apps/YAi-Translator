/**
 * «Мои списки» (этап 8Б) — как плейлисты: человек сам собирает слова для учёбы.
 * Список плиток: название, значок и число слов; создать, переименовать, удалить.
 * Внутри списка — слова, «Учить этот список» (повторение только этих карточек) и упражнения по списку.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { STUDY_LIST_MAX } from '../../../shared/study';
import { useStudy } from '../../hooks/useStudy';
import { makeList, LIST_EMOJI_MAX, LIST_TITLE_MAX } from '../../lib/studyLists';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconClose, IconSparkles, IconTrash } from '../../components/layout/icons';

export default function ListsPage() {
  const { t } = useTranslation();
  const { lists, createList, updateList, deleteList } = useStudy();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...lists].sort((left, right) => right.updatedAt - left.updatedAt),
    [lists],
  );

  const submit = () => {
    const list = makeList(title, emoji);
    if (!list) return;
    if (!createList(list)) return;
    setTitle('');
    setEmoji('');
    setEditing(list.id);
  };

  const full = lists.length >= STUDY_LIST_MAX;

  return (
    <>
      <PageHeader title={t('study.listsTitle')} subtitle={t('study.listsSubtitle')} />

      <div className="space-y-3">
        <Card className="p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex flex-wrap gap-2"
          >
            <input
              value={emoji}
              onChange={(event) => setEmoji(event.target.value)}
              placeholder="📚"
              aria-label={t('study.listEmoji')}
              maxLength={LIST_EMOJI_MAX}
              className="h-11 w-16 rounded-xl border border-line bg-card px-3 text-center text-sm outline-none focus:border-accent"
            />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('study.listNewName')}
              aria-label={t('study.listNewName')}
              maxLength={LIST_TITLE_MAX}
              className="h-11 min-w-[10rem] flex-1 rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={title.trim().length === 0 || full}
              title={full ? t('study.listLimit', { n: STUDY_LIST_MAX }) : undefined}
            >
              {t('study.listCreate')}
            </Button>
          </form>
        </Card>

        {sorted.length === 0 ? (
          <Card className="p-4">
            <EmptyState icon={<IconSparkles className="h-6 w-6" />} title={t('study.listsEmpty')} text={t('study.listsEmptyText')} />
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {sorted.map((list) => (
              <div key={list.id} className="rounded-2xl border border-line bg-card p-3 shadow-card">
                {editing === list.id ? (
                  <RenameRow
                    initialTitle={list.title}
                    initialEmoji={list.emoji}
                    onSave={(nextTitle, nextEmoji) => {
                      updateList(list.id, { title: nextTitle, emoji: nextEmoji });
                      setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <Link to={`/learn/lists/${list.id}`} className="block">
                    <p className="truncate text-sm font-medium text-ink">
                      {list.emoji ? `${list.emoji} ` : ''}
                      {list.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{t('study.deckWordsCount', { n: list.cardIds.length })}</p>
                  </Link>
                )}

                {editing === list.id ? null : (
                  <div className="mt-2 flex items-center gap-1">
                    <Link
                      to={`/learn/lists/${list.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-accentSoft px-2.5 text-xs font-medium text-accent hover:brightness-105"
                    >
                      {t('study.listOpen')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditing(list.id)}
                      className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-soft hover:text-ink"
                    >
                      {t('study.listRename')}
                    </button>
                    <button
                      type="button"
                      aria-label={t('study.listDelete')}
                      title={t('study.listDelete')}
                      onClick={() => deleteList(list.id)}
                      className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-danger"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** Переименование прямо в плитке: название и значок. */
function RenameRow({
  initialTitle,
  initialEmoji,
  onSave,
  onCancel,
}: {
  initialTitle: string;
  initialEmoji: string;
  onSave: (title: string, emoji: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [emoji, setEmoji] = useState(initialEmoji);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim().length === 0) return;
        onSave(title, emoji);
      }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input
        value={emoji}
        onChange={(event) => setEmoji(event.target.value)}
        aria-label={t('study.listEmoji')}
        maxLength={LIST_EMOJI_MAX}
        className="h-8 w-12 rounded-lg border border-line bg-card px-2 text-center text-sm outline-none focus:border-accent"
      />
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label={t('study.listRename')}
        maxLength={LIST_TITLE_MAX}
        className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-accent"
      />
      <Button type="submit" size="sm" variant="primary">
        {t('common.save')}
      </Button>
      <button
        type="button"
        aria-label={t('common.cancel')}
        title={t('common.cancel')}
        onClick={onCancel}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </form>
  );
}

/** Ссылка на упражнение по списку: повторение и упражнения берут только слова этого списка. */
export function listPracticeLink(listId: string, type: string): string {
  return `/learn/practice/${type}?list=${encodeURIComponent(listId)}`;
}

/** Ссылка на повторение только этого списка. */
export function listReviewLink(listId: string): string {
  return `/learn/review?list=${encodeURIComponent(listId)}`;
}
