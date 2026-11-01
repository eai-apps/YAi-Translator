/**
 * Карточка «Слово дня» (этап 6): одна на всех, приходит с сервера.
 * Показывается на «Учёбе» и под пустым полем на «Переводе».
 * Две кнопки-ответа: «Знаю» засчитывает повторение, «Не знаю» ставит слово
 * на повторение как новое. Каждое слово дня засчитывается один раз.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { deckTranslation, studyCardId } from '../../../shared/study';
import { ARTICLE_COLORS } from '../../config';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useStudy } from '../../hooks/useStudy';
import { useStudyPing } from '../../hooks/useStudyPing';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { cardFromDeckWord } from '../../lib/studyCard';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SpeakButton } from '../ui/SpeakButton';
import { IconCheck, IconClose, IconSparkles } from '../layout/icons';
import { AddToCardsButton } from './AddToCardsButton';

interface WordOfDayCardProps {
  /** Короткая версия под полем перевода: без примера. */
  compact?: boolean;
  className?: string;
}

export function WordOfDayCard({ compact = false, className }: WordOfDayCardProps) {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { data, closed, close, answeredToday, markAnswered } = useWordOfDay();
  const { addCard, grade } = useStudy();
  const ping = useStudyPing();
  const speech = useSpeech();

  if (!data || closed) return null;

  const word = data.word;
  const input = cardFromDeckWord(word, uiLanguage);
  const target = uiLanguage === 'de' ? 'ru' : uiLanguage;
  const spoken = word.article ? `${word.article} ${word.lemma}` : word.lemma;

  const answer = (known: boolean) => {
    if (answeredToday) return;
    addCard(input);
    // Знаю — оценка «Помню», не знаю — «Не помню»: слово вернётся в конце сессии.
    grade(studyCardId(word.lemma), known ? 'good' : 'again');
    ping.count('reviews');
    markAnswered();
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
          <IconSparkles className="h-4 w-4 text-accent" />
          <span>{t('study.wordOfDay')}</span>
          {data.level ? (
            <span className="rounded-full bg-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              ~{data.level}
            </span>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{t(data.deckTitleKey)}</span>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t('study.wordOfDayHide')}
          title={t('study.wordOfDayHide')}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {word.article ? (
          <span className={cn('text-base font-bold uppercase tracking-wide', ARTICLE_COLORS[word.article])}>
            {word.article}
          </span>
        ) : null}
        <span className="text-xl font-semibold leading-tight">{word.lemma}</span>
        <SpeakButton
          text={spoken}
          language="de"
          id="word-of-day"
          speech={speech}
          label={t('study.speakWord')}
        />
      </div>

      {/* Пока ответа нет — перевод скрыт: это и есть вопрос дня. */}
      {answeredToday || compact ? (
        <p className="mt-1 text-sm">{deckTranslation(word, uiLanguage)}</p>
      ) : (
        <p className="mt-1 text-sm text-muted">{t('study.wordOfDayQuestion')}</p>
      )}
      {word.plural ? (
        <p className="mt-0.5 text-xs text-muted">
          {t('study.pluralShort')}: {word.plural}
        </p>
      ) : null}

      {!compact ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {word.example ? <><span lang="de">{word.example.text}</span> — {word.example.translation}</> : null}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {answeredToday || compact ? null : (
          <>
            <Button size="sm" icon={<IconClose className="h-4 w-4" />} onClick={() => answer(false)}>
              {t('study.wordOfDayDontKnow')}
            </Button>
            <Button size="sm" variant="primary" icon={<IconCheck className="h-4 w-4" />} onClick={() => answer(true)}>
              {t('study.wordOfDayKnow')}
            </Button>
          </>
        )}
        {answeredToday ? <span className="text-xs text-success">{t('study.wordOfDayDone')}</span> : null}
        <Link
          to={`/?text=${encodeURIComponent(word.lemma)}&from=de&to=${target}`}
          className="inline-flex h-9 items-center rounded-xl border border-line bg-card px-3 text-sm font-medium text-ink hover:bg-soft"
        >
          {t('study.translateWord')}
        </Link>
        <AddToCardsButton input={input} />
      </div>
    </Card>
  );
}
