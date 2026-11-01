/**
 * Мгновенная карточка слова из собственной базы лексикона (этапы 11, 13, 14).
 * Показывается сразу (<50 мс), пока нейросеть формирует полный ответ,
 * либо служит полноценной карточкой без ИИ для гостей.
 * Поддерживает любой язык (de, en, ru, uk, fr, es, it, pt, pl, nl, tr, ar).
 */
import { useTranslation } from 'react-i18next';
import type { DictEntry, LanguageCode } from '../../../shared/types';
import { getCefrLevel } from '../../../shared/lexicon';
import type { LexiconMatch, ResolvedLexiconEntry } from '../../hooks/useLexicon';
import type { SpeechController } from '../../hooks/useSpeech';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { partOfSpeechKey } from '../../lib/labels';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { SpeakButton } from '../ui/SpeakButton';
import { AddToStudyQuickButton } from '../study/AddToStudyQuickButton';
import { DictExamples } from './DictExamples';
import { Chips } from './Chips';
import { InstantExamplesSection } from './InstantExamplesSection';
import { InstantFormsSection } from './InstantFormsSection';

interface InstantWordCardProps {
  match: LexiconMatch;
  speech?: SpeechController;
  isPreparingAi?: boolean;
  dictEntry?: DictEntry | null;
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  onPickWord?: (word: string) => void;
}

function getFormsText(entry: ResolvedLexiconEntry): string {
  if (entry.pos === 'n') {
    return [entry.gen, entry.pl].filter(Boolean).join(', ');
  }
  if (entry.pos === 'v') {
    const thirdPart = entry.p2 ? (entry.aux === 'sein' ? `ist ${entry.p2}` : entry.p2) : '';
    return [entry.p3, entry.prt, thirdPart].filter(Boolean).join(', ');
  }
  if (entry.pos === 'adj') {
    return [entry.comp, entry.sup].filter(Boolean).join(', ');
  }
  return '';
}

function getPosKey(pos?: string): string {
  if (pos === 'n') return partOfSpeechKey('noun');
  if (pos === 'v') return partOfSpeechKey('verb');
  if (pos === 'adj') return partOfSpeechKey('adjective');
  if (pos === 'adv') return partOfSpeechKey('adverb');
  return partOfSpeechKey('other');
}

export function InstantWordCard({
  match,
  speech,
  isPreparingAi,
  dictEntry,
  onPickTranslation,
  onPickWord,
}: InstantWordCardProps) {
  const { t, i18n } = useTranslation();
  const entry = match.entry;
  const wordLang = match.lang || 'de';
  const forms = getFormsText(entry);
  const nounGender = entry.pos === 'n' ? entry.g : undefined;
  const isGermanArticle = nounGender && ['der', 'die', 'das'].includes(nounGender);
  const article = isGermanArticle ? (nounGender as 'der' | 'die' | 'das') : null;
  const cefrLevel = getCefrLevel(entry.fr);

  // Извлекаем переводы: сначала из dictEntry, если нет — напрямую из tr в базе лексикона
  const dictTranslations = dictEntry?.senses.filter((s) => s.translation) ?? [];
  const currentUiLang = (i18n.language?.slice(0, 2) as LanguageCode) || 'ru';

  const fallbackTrList: string[] =
    entry.tr
      ? entry.tr[currentUiLang] ||
        (currentUiLang !== 'ru' ? entry.tr.ru : undefined) ||
        (currentUiLang !== 'en' ? entry.tr.en : undefined) ||
        (currentUiLang !== 'de' ? entry.tr.de : undefined) ||
        (currentUiLang !== 'uk' ? entry.tr.uk : undefined) ||
        []
      : [];

  const studyTranslations =
    dictTranslations.length > 0
      ? dictTranslations.map((s) => s.translation).filter((s): s is string => Boolean(s))
      : fallbackTrList;

  return (
    <article className="animate-fade-in space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {article ? (
              <span className={cn('text-base font-bold uppercase tracking-wide', ARTICLE_COLORS[article])}>
                {article}
              </span>
            ) : nounGender ? (
              <span className="text-xs font-semibold text-muted uppercase">({nounGender})</span>
            ) : null}
            <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{match.lemma}</h2>

            {/* Произношение: британское и американское для английского, либо общее IPA */}
            {entry.ipaUk || entry.ipaUs ? (
              <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                {entry.ipaUk && <span>UK: [{entry.ipaUk}]</span>}
                {entry.ipaUs && <span>US: [{entry.ipaUs}]</span>}
              </span>
            ) : entry.ipa ? (
              <span className="text-sm text-muted">[{entry.ipa}]</span>
            ) : null}

            <Badge tone="neutral">{t(getPosKey(entry.pos))}</Badge>
            {cefrLevel ? (
              <span
                title={t('word.approxLevelDesc')}
                className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-accent cursor-help"
              >
                ~{cefrLevel}
              </span>
            ) : null}
            <Badge tone="success">{t('word.instantBadge')}</Badge>
          </div>
          {forms ? (
            <p className="mt-1 break-words text-sm italic leading-relaxed text-muted">{forms}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <AddToStudyQuickButton
            lemma={match.lemma}
            lang={wordLang}
            article={article}
            translations={studyTranslations}
          />
          {speech ? (
            <SpeakButton
              text={match.lemma}
              language={wordLang}
              id={`instant-${wordLang}-${match.lemma}`}
              speech={speech}
              audioUrl={entry.audio}
            />
          ) : null}
        </div>
      </header>

      {isPreparingAi ? (
        <div className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-xs text-muted">
          <Spinner />
          <span>{t('word.preparingDetails')}</span>
        </div>
      ) : null}

      {dictTranslations.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('word.meanings')}</p>
          <ul className="space-y-1.5">
            {dictTranslations.map((sense, idx) => (
              <li key={`tr-${idx}`}>
                {onPickTranslation && sense.translationLang ? (
                  <Chips
                    items={(sense.translation ?? '').split(',').map((p) => p.trim()).filter(Boolean)}
                    tone="accent"
                    onPick={(val) => onPickTranslation(val, sense.translationLang as LanguageCode)}
                  />
                ) : (
                  <p className="text-base font-medium">{sense.translation}</p>
                )}
                {sense.definition ? (
                  <p className="text-xs text-muted">{sense.definition}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : fallbackTrList.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('word.meanings')}</p>
          <Chips
            items={fallbackTrList}
            tone="accent"
            onPick={onPickTranslation ? (val) => onPickTranslation(val, currentUiLang) : () => {}}
          />
        </section>
      ) : null}

      {dictEntry?.examples && dictEntry.examples.length > 0 && speech ? (
        <DictExamples examples={dictEntry.examples} language={wordLang} speech={speech} />
      ) : null}

      {/* Синонимы из базы */}
      {entry.syn && entry.syn.length > 0 ? (
        <section className="space-y-1.5 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('word.synonyms')}</p>
          <Chips
            items={entry.syn}
            onPick={(val) => {
              if (onPickWord) onPickWord(val);
              else if (onPickTranslation) onPickTranslation(val, wordLang);
            }}
          />
        </section>
      ) : null}

      {/* Формы слова: спряжение глагола, склонение существительного, степени прилагательного */}
      <InstantFormsSection lemma={match.lemma} entry={entry} lang={wordLang} />

      {/* Примеры предложений Tatoeba */}
      <InstantExamplesSection lemma={match.lemma} lang={wordLang} speech={speech} />
    </article>
  );
}
