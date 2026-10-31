/** Строка списка «Мои карточки»: слово, перевод, статус и действия (этап 6). */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { StudyCard, StudyProgress } from '../../../shared/types';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { isDue } from '../../lib/srs';
import type { SpeechController } from '../../hooks/useSpeech';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { SpeakButton } from '../ui/SpeakButton';
import { IconTranslate, IconTrash } from '../layout/icons';
import { AddToStudyMenu } from './AddToStudyMenu';

interface StudyCardRowProps {
  card: StudyCard;
  progress: StudyProgress | null;
  speech: SpeechController;
  onRemove: () => void;
  /** Подпись у красной кнопки: «Удалить из карточек» или «Убрать из списка» (этап 8Б). */
  removeLabel?: string;
  /** Меню «В карточки ▾ / В список…» справа — есть ли слово в карточках и в списках. */
  menu?: boolean;
}

export function StudyCardRow({ card, progress, speech, onRemove, removeLabel, menu }: StudyCardRowProps) {
  const { t } = useTranslation();
  const spoken = card.article ? `${card.article} ${card.lemma}` : card.lemma;
  const status = !progress ? 'new' : isDue(progress) ? 'due' : progress.lapses > 0 ? 'hard' : 'ok';
  const open = `/?${new URLSearchParams({ text: card.lemma, from: 'de', to: 'ru' }).toString()}`;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-card">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          {card.article ? (
            <span className={cn('text-sm font-bold uppercase', ARTICLE_COLORS[card.article])}>{card.article}</span>
          ) : null}
          <span className="truncate text-sm font-semibold">{card.lemma}</span>
          <Badge tone={status === 'due' ? 'accent' : 'neutral'}>
            {t(`study.status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{card.translations.join(', ')}</p>
        {card.plural ? (
          <p className="truncate text-[11px] text-muted">
            {t('study.pluralShort')}: {card.plural}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <SpeakButton text={spoken} language="de" id={`card-${card.id}`} speech={speech} label={t('study.speakWord')} />
        <Link
          to={open}
          aria-label={t('study.cardOpen')}
          title={t('study.cardOpen')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-muted transition-colors hover:bg-soft hover:text-ink"
        >
          <IconTranslate className="h-[18px] w-[18px]" />
        </Link>
        <IconButton
          label={removeLabel ?? t('study.cardDelete')}
          title={removeLabel ?? t('study.cardDelete')}
          onClick={onRemove}
          icon={<IconTrash className="h-[18px] w-[18px]" />}
        />
        {menu ? (
          <AddToStudyMenu
            input={{
              lemma: card.lemma,
              article: card.article,
              plural: card.plural,
              partOfSpeech: card.partOfSpeech,
              translations: card.translations,
              example: card.example,
              perfekt: card.perfekt,
            }}
            iconOnly
          />
        ) : null}
      </div>
    </div>
  );
}
