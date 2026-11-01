/**
 * Кнопка «+ В учёбу» / «✓ В учёбе» (этап 13).
 * Добавляет слово в учёбу в 1 клик и автоматически создаёт/пополняет
 * персональную колоду «Из переводов».
 */
import { useTranslation } from 'react-i18next';
import type { PartOfSpeech, StudyArticle, StudyCardInput, StudyExample } from '../../../shared/types';
import { studyCardId } from '../../../shared/study';
import { cn } from '../../lib/cn';
import { useStudy } from '../../hooks/useStudy';
import { getGermanTranslation } from '../../data/commonTranslationsDeRu';
import { IconBookmark } from '../layout/icons';

interface AddToStudyQuickButtonProps {
  lemma: string;
  article?: StudyArticle | null;
  translations?: string[];
  partOfSpeech?: PartOfSpeech;
  plural?: string | null;
  perfekt?: string | null;
  example?: StudyExample | null;
  variant?: 'button' | 'chip' | 'compact';
  className?: string;
  stopPropagation?: boolean;
}

export function AddToStudyQuickButton({
  lemma,
  article = null,
  translations,
  partOfSpeech = 'noun',
  plural = null,
  perfekt = null,
  example = null,
  variant = 'button',
  className,
  stopPropagation = true,
}: AddToStudyQuickButtonProps) {
  const { t } = useTranslation();
  const { hasCard, addCard, removeCard, lists, createList, addToList } = useStudy();

  const cleanLemma = lemma.trim();
  const cardId = studyCardId(cleanLemma);
  const inCards = hasCard(cleanLemma);

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (inCards) {
      removeCard(cardId);
      return;
    }

    // Собираем данные карточки
    const ruTr = getGermanTranslation(cleanLemma);
    const resolvedTranslations =
      translations && translations.length > 0
        ? translations
        : ruTr
        ? [ruTr]
        : [cleanLemma];

    const input: StudyCardInput = {
      lemma: cleanLemma,
      article,
      plural,
      partOfSpeech,
      translations: resolvedTranslations,
      example,
      perfekt,
    };

    addCard(input);

    // Автоматически создаём колоду «Из переводов» или добавляем в существующую
    const targetTitle = t('study.listFromTranslations');
    const existingList = lists.find(
      (l) => l.id === 'from_translations' || l.title === targetTitle || l.title === 'Из переводов',
    );

    if (existingList) {
      addToList([cardId], existingList.id);
    } else {
      createList({
        id: 'from_translations',
        title: targetTitle,
        emoji: '📖',
        cardIds: [cardId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const label = inCards ? t('study.inStudy') : t('study.addToStudy');

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors',
          inCards
            ? 'bg-accentSoft text-accent'
            : 'bg-soft text-ink hover:bg-card hover:text-accent',
          className,
        )}
      >
        <IconBookmark className="h-3.5 w-3.5" filled={inCards} />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
          inCards
            ? 'bg-accent text-accentInk'
            : 'bg-soft text-muted hover:bg-line hover:text-ink',
          className,
        )}
      >
        <span>{inCards ? `✓ ${t('study.inStudy')}` : t('study.addToStudy')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors',
        inCards
          ? 'border border-accent bg-accentSoft text-accent'
          : 'border border-line bg-card text-ink hover:bg-soft hover:text-accent',
        className,
      )}
    >
      <IconBookmark className="h-4 w-4" filled={inCards} />
      <span>{label}</span>
    </button>
  );
}
