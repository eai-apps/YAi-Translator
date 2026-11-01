/**
 * Карточка слова только из словарей (когда ИИ недоступен: лимит, нет ключей, ошибка).
 * Значения, род, формы, синонимы и настоящие примеры — с пометкой «Без ИИ — данные словарей».
 */
import { useAccount } from '../../hooks/useAccount';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DictEntry, LanguageCode } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { useSettings } from '../../hooks/useSettings';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { partOfSpeechKey } from '../../lib/labels';
import { cardFromDict } from '../../lib/studyCard';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';
import { AddToStudyMenu } from '../study/AddToStudyMenu';
import { ChipList } from './ChipList';
import { Chips } from './Chips';
import { DictExamples } from './DictExamples';
import { SourcesLine } from './SourcesLine';

interface DictCardProps {
  entry: DictEntry;
  speech: SpeechController;
  /** true — ИИ ответил и данные словарей только дополняют его карточку. */
  withAi: boolean;
  /** Нажатие на перевод значения: перевести обратно (этап 8). */
  onPick?: (translation: string, lang: LanguageCode) => void;
}

export function DictCard({ entry, speech, withAi, onPick }: DictCardProps) {
  // Вошедшим не предлагаем «зарегистрироваться» — у них ИИ уже есть.
  const signedIn = useAccount().status === 'signedIn';
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  // Значения на исходном языке и их переводы, если источник их даёт (PONS).
  const translations = entry.senses.filter((sense) => sense.translation);
  const definitions = entry.senses.filter((sense) => !sense.translation);
  const studyInput = cardFromDict(entry, uiLanguage);

  return (
    <article className="animate-fade-in">
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {entry.sourceLang === 'de' && entry.gender ? (
          <span className={cn('text-base font-bold uppercase tracking-wide', ARTICLE_COLORS[entry.gender])}>
            {entry.gender}
          </span>
        ) : null}
        <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{entry.word}</h2>
        {entry.partOfSpeech ? <Badge>{t(partOfSpeechKey(entry.partOfSpeech))}</Badge> : null}
        {entry.transcription ? <span className="text-sm text-muted">{entry.transcription}</span> : null}
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={withAi ? 'success' : 'accent'}>{t('dict.badge')}</Badge>
        {!withAi ? <span className="text-xs text-muted">{t('dict.withoutAi')}</span> : null}
        <AddToStudyMenu input={studyInput} className="ml-auto" />
      </div>

      {translations.length > 0 ? (
        <section className="mt-5">
          <SectionTitle>{t('word.meanings')}</SectionTitle>
          <ul className="mt-2 space-y-2">
            {translations.map((sense, index) => (
              <li key={`translation-${index}`}>
                {onPick && sense.translationLang ? (
                  // Перевод из двуязычного словаря — чипса: нажатие переводит его обратно.
                  <Chips
                    items={(sense.translation ?? '').split(',').map((part) => part.trim()).filter(Boolean)}
                    tone="accent"
                    onPick={(value) => onPick(value, sense.translationLang as LanguageCode)}
                  />
                ) : (
                  <p
                    dir={sense.translationLang ? textDirection(sense.translationLang) : 'auto'}
                    className="text-base font-medium leading-snug"
                  >
                    {sense.translation}
                  </p>
                )}
                {sense.definition ? (
                  <p className="text-xs leading-relaxed text-muted">{sense.definition}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {definitions.length > 0 ? (
        <section className="mt-5">
          <SectionTitle>{t('dict.definitions')}</SectionTitle>
          <ol className="mt-2 space-y-1.5">
            {definitions.map((sense, index) => (
              <li key={`definition-${index}`} className="flex gap-2 text-sm leading-relaxed">
                <span className="tabular-nums text-muted">{index + 1}.</span>
                <span dir={textDirection(entry.sourceLang)}>{sense.definition}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {entry.definitions.length > 0 ? (
        <section className="mt-5">
          <SectionTitle>
            {t('dict.germanMeaning')}{' '}
            <a
              href={entry.definitions[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold normal-case tracking-normal underline decoration-dotted underline-offset-2"
            >
              DWDS
            </a>
          </SectionTitle>
          <ol className="mt-2 space-y-1.5">
            {entry.definitions.map((item, index) => (
              <li key={`dwds-${index}`} className="flex gap-2 text-sm leading-relaxed">
                <span className="tabular-nums text-muted">{index + 1}.</span>
                <span lang="de">{item.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {entry.plural ? (
        <p className="mt-4 text-sm">
          <span className="text-muted">{t('word.plural')}: </span>
          {entry.plural}
        </p>
      ) : null}

      {entry.forms.length > 0 ? (
        <section className="mt-5">
          <SectionTitle>{t('dict.forms')}</SectionTitle>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {entry.forms.map((form) => (
              <p key={form.label} className="truncate text-sm">
                <span className="text-xs text-muted">{form.label}: </span>
                {form.value}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {entry.synonyms.length > 0 ? (
        <section className="mt-5">
          <SectionTitle>{t('word.synonyms')}</SectionTitle>
          <ChipList items={entry.synonyms} />
        </section>
      ) : null}

      <DictExamples examples={entry.examples} language={entry.sourceLang} speech={speech} />

      <SourcesLine sources={entry.sources} />

      {!withAi && !signedIn ? (
        <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
          <span>{t('dict.guestAiHintPrefix')}{' '}</span>
          <Link to="/profile" className="font-medium text-accent hover:underline">
            {t('dict.guestAiHintLink')}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
