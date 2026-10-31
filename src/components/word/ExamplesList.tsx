/**
 * Вкладка «Примеры» (этап 8): фильтр-чипсы «все» + значения слова, уровень A2/B1/B2 и источник
 * (Tatoeba / Wiktionary) у каждого примера, 🔊, перевод и подсветка искомого слова в обоих предложениях.
 * Нажатие на немецкое предложение переводит его целиком.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictExample, LanguageCode, WordCard, WordExample } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { cn } from '../../lib/cn';
import { knownWordForms, splitHighlight } from '../../lib/exampleHighlight';
import { usePick } from './pick';
import { HighlightedText } from './HighlightedText';
import { SpeakButton } from '../ui/SpeakButton';

interface ExamplesListProps {
  card: WordCard;
  speech: SpeechController;
  /** Настоящие примеры из словарей — «Из жизни» (Tatoeba). */
  dictExamples?: DictExample[];
  /** Язык примеров из словарей. */
  dictLang?: LanguageCode | null;
  /** Язык переводов (для направления текста). */
  translationLang?: LanguageCode | null;
}

/** Значение фильтра: «все» или номер значения. */
type SenseFilter = 'all' | number;

/** Подпись источника примера ИИ: уровень CEFR A2 / B1 / B2. */
function aiSourceLabel(example: WordExample): string {
  return example.level;
}

/** Подпись источника примера из словаря: Tatoeba или Wiktionary. */
function dictSourceLabel(example: DictExample, t: (key: string) => string): string {
  return example.source === 'tatoeba' ? t('dict.fromTatoeba') : t('dict.fromWiktionary');
}

export function ExamplesList({
  card,
  speech,
  dictExamples = [],
  dictLang = null,
  translationLang = null,
}: ExamplesListProps) {
  const { t } = useTranslation();
  const pick = usePick();
  const [filter, setFilter] = useState<SenseFilter>('all');

  // Значения для фильтра: только те, у которых есть примеры.
  const senseOptions = useMemo(() => {
    const numbers = new Set<number>();
    for (const example of card.examples) if (example.sense) numbers.add(example.sense);
    return [...numbers].sort((left, right) => left - right);
  }, [card.examples]);

  const active: SenseFilter = filter === 'all' || senseOptions.includes(filter) ? filter : 'all';
  const aiExamples = card.examples.filter((example) => active === 'all' || example.sense === active);
  // Примеры «из жизни» показываем во вкладке «все»: они не привязаны к значениям ИИ.
  const lifeExamples = active === 'all' ? dictExamples : [];
  const forms = useMemo(() => knownWordForms(card), [card]);

  if (card.examples.length === 0 && dictExamples.length === 0) return null;

  return (
    <section>
      <h4 className="text-sm font-semibold">{t('word.examplesTitle')}</h4>

      {senseOptions.length > 1 ? (
        <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {(['all', ...senseOptions] as SenseFilter[]).map((value) => {
            const label =
              value === 'all'
                ? t('word.filterAll')
                : card.meanings[value - 1]?.translations[0] ?? `${value}`;
            const isActive = value === active;
            return (
              <button
                key={String(value)}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(value)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors',
                  isActive ? 'bg-accent text-accentInk' : 'bg-soft text-muted hover:text-ink',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="mt-2 space-y-2">
        {aiExamples.map((example, index) => {
          const partsSource = splitHighlight(example.text, {
            slice: example.match?.source,
            forms: card.language === 'de' ? forms : [],
            lemma: card.lemma,
          });
          const partsTarget = splitHighlight(example.translation, {
            slice: example.match?.target,
            forms: [],
            lemma: null,
          });
          return (
            <li key={`ai-${example.level}-${index}`} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-relaxed">
                    <HighlightedText parts={partsSource} />
                  </p>
                  {example.translation ? (
                    <p
                      dir={translationLang ? textDirection(translationLang) : 'auto'}
                      className="mt-0.5 text-sm leading-relaxed text-muted"
                    >
                      <HighlightedText parts={partsTarget} />
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
                    {aiSourceLabel(example)}
                  </p>
                </div>
                <SpeakButton
                  text={example.text}
                  language={card.language}
                  id={`example-ai-${index}`}
                  speech={speech}
                  label={t('common.listen')}
                />
              </div>
            </li>
          );
        })}

        {lifeExamples.map((example, index) => {
          const partsSource = splitHighlight(example.text, { forms, lemma: card.lemma });
          return (
            <li key={`life-${index}`} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p dir={textDirection(dictLang ?? card.language)} className="text-sm font-medium leading-relaxed">
                    {/* Нажатие на предложение переводит его целиком. */}
                    {pick ? (
                      <button type="button" onClick={() => pick(example.text)} className="text-left hover:underline hover:decoration-dotted hover:underline-offset-4">
                        <HighlightedText parts={partsSource} />
                      </button>
                    ) : (
                      <HighlightedText parts={partsSource} />
                    )}
                  </p>
                  {example.translation ? (
                    <p
                      dir={example.translationLang ? textDirection(example.translationLang) : 'auto'}
                      className="mt-0.5 text-sm leading-relaxed text-muted"
                    >
                      {example.translation}
                    </p>
                  ) : null}
                  <a
                    href={example.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[11px] text-muted underline decoration-dotted underline-offset-2 hover:text-ink"
                  >
                    {dictSourceLabel(example, t)}
                  </a>
                </div>
                <SpeakButton
                  text={example.text}
                  language={dictLang ?? card.language}
                  id={`life-${index}`}
                  speech={speech}
                  label={t('common.listen')}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
