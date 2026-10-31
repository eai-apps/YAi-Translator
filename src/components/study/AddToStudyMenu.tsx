/**
 * Кнопка «В карточки ▾» (этап 8Б): меню с двумя путями —
 * «В карточки» (обычное добавление в «Мои карточки») и «В список…» (выбор своего списка
 * или «+ Новый список» прямо здесь, без ухода со страницы).
 * Если списков ещё нет — «Новый список» создаётся из названия карточки.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StudyCardInput } from '../../../shared/types';
import { studyCardId } from '../../../shared/study';
import { cn } from '../../lib/cn';
import { useStudy } from '../../hooks/useStudy';
import { makeList, LIST_TITLE_MAX } from '../../lib/studyLists';
import { Button } from '../ui/Button';
import { IconBookmark } from '../layout/icons';

interface AddToStudyMenuProps {
  input: StudyCardInput | null;
  /** Только иконка — для строки действий рядом со звёздочкой. */
  iconOnly?: boolean;
  className?: string;
}

export function AddToStudyMenu({ input, iconOnly = false, className }: AddToStudyMenuProps) {
  const { t } = useTranslation();
  const { hasCard, addCard, removeCard, lists, addToList, createList, listsWithCard } = useStudy();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!input) return null;
  const cardId = studyCardId(input.lemma);
  const inCards = hasCard(input.lemma);
  const inLists = listsWithCard(cardId);
  const anything = inCards || inLists.length > 0;

  const toggleCards = () => {
    if (inCards) removeCard(cardId);
    else addCard(input);
  };

  /** «В список»: слово сначала попадает в карточки, иначе список ссылался бы на пустоту. */
  const putToList = (listId: string) => {
    if (!inCards) addCard(input);
    addToList([cardId], listId);
    setOpen(false);
  };

  const createAndPut = () => {
    const list = makeList(newTitle || input.lemma, '');
    if (!list || !createList(list)) return;
    if (!inCards) addCard(input);
    addToList([cardId], list.id);
    setNewTitle('');
    setOpen(false);
  };

  const label = anything ? t('study.inStudy') : t('study.addToCards');

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          // Простая кнопка: пока списков нет, это обычное «В карточки» без меню.
          if (iconOnly && lists.length === 0) toggleCards();
          else setOpen((previous) => !previous);
        }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border transition-colors',
          iconOnly ? 'h-9 w-9 justify-center' : 'h-9 px-3 text-sm font-medium',
          anything
            ? 'border-accent bg-accentSoft text-accent'
            : 'border-line bg-card text-ink hover:bg-soft',
        )}
      >
        <IconBookmark className={iconOnly ? 'h-[18px] w-[18px]' : 'h-4 w-4'} filled={anything} />
        {iconOnly ? null : <span>{label}</span>}
        {iconOnly || lists.length === 0 ? null : (
          <span className="ml-auto pl-1 text-[10px] leading-none" aria-hidden="true">
            ▾
          </span>
        )}
      </button>

      {open && lists.length > 0 ? (
        <div
          role="menu"
          aria-label={t('study.addToList')}
          className="absolute right-0 z-40 mt-9 w-64 overflow-hidden rounded-xl border border-line bg-card p-1 shadow-pop"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleCards();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-soft"
          >
            {inCards ? t('study.removeFromCards') : t('study.addToCards')}
          </button>
          <div className="my-1 border-t border-line" />
          <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            {t('study.addToList')}
          </p>
          <div className="max-h-52 overflow-y-auto">
            {lists.map((list) => {
              const inside = list.cardIds.includes(cardId);
              return (
                <button
                  key={list.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={inside}
                  onClick={() => putToList(list.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-soft"
                >
                  <span className="w-4 shrink-0 text-center">{inside ? '✓' : ''}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {list.emoji ? `${list.emoji} ` : ''}
                    {list.title}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="my-1 border-t border-line" />
          <div className="flex items-center gap-1.5 px-1 pb-1">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={t('study.listNewName')}
              maxLength={LIST_TITLE_MAX}
              aria-label={t('study.listNewName')}
              className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-accent"
            />
            <Button size="sm" variant="secondary" onClick={createAndPut} disabled={newTitle.trim().length === 0}>
              {t('study.listNew')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
