/** Строка истории или избранного. Этап 8Б: у каждого слова — то же меню «В карточки ▾». */
import { useTranslation } from 'react-i18next';
import { getLanguage } from '../../../shared/languages';
import { ARTICLE_COLORS } from '../../config';
import type { HistoryItem } from '../../hooks/useHistory';
import { cn } from '../../lib/cn';
import { cardFromTranslation, splitArticle } from '../../lib/studyCard';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { IconStar, IconTranslate, IconTrash } from '../layout/icons';
import { AddToStudyMenu } from '../study/AddToStudyMenu';

interface HistoryRowProps {
  item: HistoryItem;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
}

export function HistoryRow({ item, onOpen, onToggleFavorite, onRemove }: HistoryRowProps) {
  const { t, i18n } = useTranslation();

  const sourceName =
    item.sourceLang === 'auto'
      ? t('languages.auto')
      : getLanguage(item.sourceLang)?.nativeName ?? item.sourceLang;
  const targetName = getLanguage(item.targetLang)?.nativeName ?? item.targetLang;

  // В карточки можно положить только немецкое слово из 1–3 слов (как на экране перевода).
  const { lemma } = splitArticle(item.text);
  const studyInput =
    lemma.split(/\s+/).length <= 3
      ? item.sourceLang === 'de'
        ? cardFromTranslation(item.text, item.translation)
        : item.targetLang === 'de'
          ? cardFromTranslation(item.translation, item.text)
          : null
      : null;

  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(item.createdAt));

  return (
    <Card className="flex items-start gap-2 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
          <span>
            {sourceName} → {targetName}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={new Date(item.createdAt).toISOString()}>{date}</time>
        </div>
        <p className="mt-1 break-words text-sm font-medium leading-snug">
          {item.article ? (
            <span className={cn('mr-1 font-semibold', ARTICLE_COLORS[item.article])}>
              {item.article}
            </span>
          ) : null}
          {item.text}
        </p>
        <p className="mt-0.5 line-clamp-2 break-words text-sm leading-snug text-muted">
          {item.translation}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
        {studyInput ? <AddToStudyMenu input={studyInput} iconOnly /> : null}
        <IconButton
          label={item.favorite ? t('translate.favoriteRemove') : t('translate.favoriteAdd')}
          icon={<IconStar className="h-4 w-4" filled={item.favorite} />}
          active={item.favorite}
          onClick={onToggleFavorite}
        />
        <IconButton
          label={t('dictionary.open')}
          icon={<IconTranslate className="h-4 w-4" />}
          onClick={onOpen}
        />
        <IconButton
          label={t('dictionary.remove')}
          icon={<IconTrash className="h-4 w-4" />}
          onClick={onRemove}
        />
      </div>
    </Card>
  );
}
