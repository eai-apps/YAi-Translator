/**
 * Кнопка «+ В карточки» (этап 6). Повторное нажатие убирает слово из карточек.
 * Одна на карточку слова, строку перевода и слово дня — данные приходят снимком.
 */
import { useTranslation } from 'react-i18next';
import type { StudyCardInput } from '../../../shared/types';
import { studyCardId } from '../../../shared/study';
import { cn } from '../../lib/cn';
import { useStudy } from '../../hooks/useStudy';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { IconBookmark } from '../layout/icons';

interface AddToCardsButtonProps {
  input: StudyCardInput | null;
  /** Только иконка — для строки действий рядом со звёздочкой. */
  iconOnly?: boolean;
  className?: string;
}

export function AddToCardsButton({ input, iconOnly = false, className }: AddToCardsButtonProps) {
  const { t } = useTranslation();
  const { hasCard, addCard, removeCard } = useStudy();
  if (!input) return null;

  const id = studyCardId(input.lemma);
  const inCards = hasCard(input.lemma);
  const label = inCards ? t('study.removeFromCards') : t('study.addToCards');
  const toggle = () => {
    if (inCards) removeCard(id);
    else addCard(input);
  };

  if (iconOnly) {
    return (
      <IconButton
        label={label}
        title={label}
        active={inCards}
        onClick={toggle}
        className={className}
        icon={<IconBookmark className="h-[18px] w-[18px]" filled={inCards} />}
      />
    );
  }

  return (
    <Button
      size="sm"
      variant={inCards ? 'primary' : 'secondary'}
      onClick={toggle}
      className={cn('shrink-0', className)}
      icon={<IconBookmark className="h-4 w-4" filled={inCards} />}
    >
      {inCards ? t('study.inCards') : t('study.addToCards')}
    </Button>
  );
}
