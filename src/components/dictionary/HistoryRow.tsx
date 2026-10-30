/** Строка истории или избранного. */
import { useTranslation } from 'react-i18next';
import { getLanguage } from '../../../shared/languages';
import { ARTICLE_COLORS } from '../../config';
import type { HistoryItem } from '../../hooks/useHistory';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { IconStar, IconTranslate, IconTrash } from '../layout/icons';

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

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
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
