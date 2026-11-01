/**
 * Мгновенная карточка слова из собственной базы лексикона (этап 11).
 * Показывается сразу (<50 мс), пока нейросеть формирует полный ответ,
 * либо служит полноценной карточкой без ИИ для гостей.
 */
import { useTranslation } from 'react-i18next';
import type { DictEntry, LanguageCode } from '../../../shared/types';
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

interface InstantWordCardProps {
  match: LexiconMatch;
  speech?: SpeechController;
  isPreparingAi?: boolean;
  dictEntry?: DictEntry | null;
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
}

function getFormsText(entry: ResolvedLexiconEntry): string {
  if (entry.pos === 'n') {
    return [entry.gen, entry.pl].filter(Boolean).join(', ');
  }
  if (entry.pos === 'v') {
    const thirdPart = entry.p2 ? (entry.aux === 'sein' ? `ist ${entry.p2}` : entry.p2) : '';
    return [entry.prt, thirdPart].filter(Boolean).join(', ');
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
}: InstantWordCardProps) {
  const { t } = useTranslation();
  const entry = match.entry;
  const forms = getFormsText(entry);
  const article = entry.pos === 'n' ? entry.g : null;
  const translations = dictEntry?.senses.filter((s) => s.translation) ?? [];

  return (
    <article className="animate-fade-in space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {article ? (
              <span className={cn('text-base font-bold uppercase tracking-wide', ARTICLE_COLORS[article])}>
                {article}
              </span>
            ) : null}
            <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{match.lemma}</h2>
            {entry.ipa ? (
              <span className="text-sm text-muted">[{entry.ipa}]</span>
            ) : null}
            <Badge tone="neutral">{t(getPosKey(entry.pos))}</Badge>
            <Badge tone="success">{t('word.instantBadge')}</Badge>
          </div>
          {forms ? (
            <p className="mt-1 break-words text-sm italic leading-relaxed text-muted">{forms}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <AddToStudyQuickButton
            lemma={match.lemma}
            article={article}
            translations={translations.map((s) => s.translation).filter((s): s is string => Boolean(s))}
          />
          {speech ? (
            <SpeakButton
              text={match.lemma}
              language="de"
              id={`instant-${match.lemma}`}
              speech={speech}
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

      {translations.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('word.meanings')}</p>
          <ul className="space-y-1.5">
            {translations.map((sense, idx) => (
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
      ) : null}

      {dictEntry?.examples && dictEntry.examples.length > 0 && speech ? (
        <DictExamples examples={dictEntry.examples} language="de" speech={speech} />
      ) : null}
    </article>
  );
}
