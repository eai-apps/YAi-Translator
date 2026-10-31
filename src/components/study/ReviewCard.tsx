/**
 * Карточка сессии повторения (этап 6): переворот через CSS, без библиотек.
 * Лицо — немецкое слово (или перевод в режиме «наоборот»), оборот — перевод,
 * множественное число, Perfekt и пример.
 */
import { useTranslation } from 'react-i18next';
import type { StudyCard } from '../../../shared/types';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import type { SpeechController } from '../../hooks/useSpeech';
import { SpeakButton } from '../ui/SpeakButton';

interface ReviewCardProps {
  card: StudyCard;
  /** true — сначала немецкое слово, false — сначала перевод. */
  germanSide: boolean;
  flipped: boolean;
  onFlip: () => void;
  speech: SpeechController;
}

/** «der Tisch» — так слово читает озвучка. */
export function spokenForm(card: StudyCard): string {
  return card.article ? `${card.article} ${card.lemma}` : card.lemma;
}

export function ReviewCard({ card, germanSide, flipped, onFlip, speech }: ReviewCardProps) {
  const { t } = useTranslation();
  const word = spokenForm(card);

  const germanWord = (
    <div className="flex items-baseline gap-2">
      {card.article ? (
        <span className={cn('text-xl font-bold uppercase tracking-wide', ARTICLE_COLORS[card.article])}>
          {card.article}
        </span>
      ) : null}
      <span className="text-3xl font-semibold leading-tight">{card.lemma}</span>
    </div>
  );

  return (
    <div
      className="relative h-64 w-full cursor-pointer select-none sm:h-72"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={t('study.reviewFrontHint')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
      >
        {/* Лицевая сторона. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-card p-6 text-center shadow-card"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {germanSide ? (
            <>
              {germanWord}
              <span onClick={(event) => event.stopPropagation()}>
                <SpeakButton text={word} language="de" id="review-front" speech={speech} label={t('study.speakWord')} />
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold leading-snug">{card.translations[0]}</span>
              <span className="text-xs text-muted">{t('study.reviewRecall')}</span>
            </>
          )}
          <span className="mt-2 text-xs text-muted">{t('study.reviewFrontHint')}</span>
        </div>

        {/* Оборот: перевод, множественное число, Perfekt и пример. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-2xl border border-line bg-card p-6 text-center shadow-card"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {!germanSide ? germanWord : null}
          <p className="text-lg font-medium">{card.translations.join(', ')}</p>
          {card.plural ? (
            <p className="text-sm text-muted">
              {t('study.pluralShort')}: {card.plural}
            </p>
          ) : null}
          {card.perfekt ? <p className="text-sm text-muted">Perfekt: {card.perfekt}</p> : null}
          {card.example ? (
            <p className="mt-2 max-w-sm text-sm leading-relaxed">
              <span lang="de">{card.example.text}</span>
              <span className="block text-xs text-muted">{card.example.translation}</span>
            </p>
          ) : null}
          <span onClick={(event) => event.stopPropagation()}>
            <SpeakButton text={word} language="de" id="review-back" speech={speech} label={t('study.speakWord')} />
          </span>
        </div>
      </div>
    </div>
  );
}
