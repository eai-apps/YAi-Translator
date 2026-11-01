/**
 * Заголовок карточки слова (этап 8): слово, транскрипция, часть речи, главные формы курсивом
 * и кнопки «озвучить» / «⋯» справа.
 *   глагол:     holte, geholt  (у глаголов с sein — ist gegangen)
 *   существительное: der Tisch, des Tisches, die Tische
 *   прилагательное: schön, schöner, am schönsten
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { WordCard } from '../../../shared/types';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { partOfSpeechKey } from '../../lib/labels';
import { buildComparison } from '../../lib/adjectiveForms';

interface WordCardHeaderProps {
  card: WordCard;
  /** «⋯» — меню разбора и проверки текста. */
  menu?: ReactNode;
  /** Кнопка «озвучить» — готовая кнопка SpeakButton. */
  speak?: ReactNode;
}

/** Третье лицо единственного числа из списка форм спряжения. */
function thirdPerson(forms: { pronoun: string; form: string }[] | undefined): string {
  return forms?.find((form) => form.pronoun === 'er/sie/es' || form.pronoun === 'er')?.form?.trim() ?? '';
}

export function principalForms(card: WordCard): string {
  if (card.conjugation) {
    const praeteritum = thirdPerson(card.conjugation.praeteritum);
    const infinitive = card.lemma.replace(/^sich\s+/i, '').trim().toLowerCase();
    const partizip = (card.conjugation.partizip2 || '').trim();
    // «ist gegangen» для глаголов движения и изменения состояния.
    const third = partizip
      ? card.conjugation.auxiliary === 'sein'
        ? `ist ${partizip}`
        : partizip
      : '';
    const forms = [praeteritum, third].filter((form) => form && form.toLowerCase() !== infinitive);
    return forms.join(', ');
  }

  if (card.partOfSpeech === 'noun') {
    // Склонение: Genitiv единственного и Nominativ множественного.
    const genitive = card.declension?.find((row) => row.grammaticalCase === 'genitive')?.singular ?? '';
    const plural = card.plural ?? '';
    return [genitive, plural].filter(Boolean).join(', ');
  }

  if (card.partOfSpeech === 'adjective') {
    const comparison = buildComparison(card.lemma);
    return `${comparison.comparative}, ${comparison.superlative}`;
  }

  return '';
}

export function WordCardHeader({ card, menu, speak }: WordCardHeaderProps) {
  const { t } = useTranslation();
  const forms = principalForms(card);
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {card.article ? (
            <span className={cn('text-base font-bold uppercase tracking-wide', ARTICLE_COLORS[card.article])}>
              {card.article}
            </span>
          ) : null}
          <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{card.lemma}</h2>
          {card.transcription ? (
            <span className="text-sm text-muted">[{card.transcription.replace(/^\[|\]$/g, '')}]</span>
          ) : null}
          <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">
            {t(partOfSpeechKey(card.partOfSpeech))}
          </span>
          {card.cefrLevel ? (
            <span
              title={t('word.approxLevelDesc')}
              className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-accent cursor-help"
            >
              ~{card.cefrLevel}
            </span>
          ) : null}
        </div>
        {forms ? (
          <p className="mt-1 break-words text-sm italic leading-relaxed text-muted">{forms}</p>
        ) : null}
      </div>
      {speak || menu ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {speak}
          {menu}
        </div>
      ) : null}
    </header>
  );
}
