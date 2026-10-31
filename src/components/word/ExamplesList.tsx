/**
 * Вкладка «Примеры» (этап 8): фильтр-чипсы «все» + значения слова, уровень A1/A2/B1/B2 и источник
 * (Tatoeba / Wiktionary) у каждого примера, 🔊, перевод и подсветка искомого слова в обоих предложениях.
 * Нажатие на немецкое предложение переводит его целиком.
 * Этап 8Б: уровень «Как ещё сказать» — пары «то же самое другими словами» (поле paraphrases).
 * Сами строки примеров — в ExampleRow.tsx.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictExample, LanguageCode, WordCard } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { cn } from '../../lib/cn';
import { knownWordForms } from '../../lib/exampleHighlight';
import { usePick } from './pick';
import { AiExampleRow, DictExampleRow } from './ExampleRow';
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
type LevelFilter = 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'life' | 'para';
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'] as const;

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
  // Уровень, как раньше: A1 / A2 / B1 / B2, «Как ещё сказать» и «Из жизни» (Tatoeba, Wiktionary).
  const [level, setLevel] = useState<LevelFilter>('all');

  // Значения для фильтра: только те, у которых есть примеры.
  const senseOptions = useMemo(() => {
    const numbers = new Set<number>();
    for (const example of card.examples) if (example.sense) numbers.add(example.sense);
    return [...numbers].sort((left, right) => left - right);
  }, [card.examples]);

  const active: SenseFilter = filter === 'all' || senseOptions.includes(filter) ? filter : 'all';
  const levels = LEVEL_ORDER.filter((value) => card.examples.some((example) => example.level === value));
  const paraphrases = card.paraphrases ?? [];
  const levelOptions: LevelFilter[] = [
    'all',
    ...levels,
    ...(paraphrases.length > 0 ? (['para'] as LevelFilter[]) : []),
    ...(dictExamples.length > 0 ? (['life'] as LevelFilter[]) : []),
  ];
  const activeLevel: LevelFilter = levelOptions.includes(level) ? level : 'all';
  // «Как ещё сказать» показывает только пары перефразировок, «Из жизни» — только корпус.
  const aiExamples =
    activeLevel === 'life' || activeLevel === 'para'
      ? []
      : card.examples.filter(
          (example) => (active === 'all' || example.sense === active) && (activeLevel === 'all' || example.level === activeLevel),
        );
  // Примеры «из жизни» не привязаны к значениям ИИ: показываем при «все» или «Из жизни».
  const lifeExamples = active === 'all' && (activeLevel === 'all' || activeLevel === 'life') ? dictExamples : [];
  const shownParaphrases = active === 'all' && (activeLevel === 'all' || activeLevel === 'para') ? paraphrases : [];
  const forms = useMemo(() => knownWordForms(card), [card]);

  if (card.examples.length === 0 && dictExamples.length === 0) return null;

  return (
    <section>
      <h4 className="text-sm font-semibold">{t('word.examplesTitle')}</h4>

      {levelOptions.length > 2 ? (
        <div className="mt-2 inline-flex flex-wrap gap-1 rounded-xl bg-soft p-1" role="group" aria-label={t('word.examplesTitle')}>
          {levelOptions.map((value) => {
            const isActive = value === activeLevel;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setLevel(value)}
                className={cn(
                  'rounded-lg px-3 py-1 text-sm font-medium transition-colors',
                  isActive ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                {value === 'all' ? t('word.filterAll') : value === 'life' ? t('dict.fromLife') : value === 'para' ? t('word.filterParaphrase') : value}
              </button>
            );
          })}
        </div>
      ) : null}

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
        {aiExamples.map((example, index) => (
          <AiExampleRow
            key={`ai-${example.level}-${index}`}
            example={example}
            index={index}
            forms={forms}
            lemma={card.lemma}
            language={card.language}
            translationLang={translationLang}
            speech={speech}
            pick={pick ?? null}
          />
        ))}

        {shownParaphrases.length > 0 ? (
          <li className="rounded-xl bg-soft px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{t('word.paraphrasesTitle')}</p>
            <ul className="mt-1.5 space-y-2">
              {shownParaphrases.map((pair, index) => (
                <li key={`para-${index}`} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-relaxed">
                      {pick ? (
                        <button
                          type="button"
                          onClick={() => pick(pair.text)}
                          className="text-left hover:underline hover:decoration-dotted hover:underline-offset-4"
                        >
                          {pair.text}
                        </button>
                      ) : (
                        pair.text
                      )}
                    </p>
                    {pair.translation ? (
                      <p
                        dir={translationLang ? textDirection(translationLang) : 'auto'}
                        className="mt-0.5 text-sm leading-relaxed text-muted"
                      >
                        {pair.translation}
                      </p>
                    ) : null}
                  </div>
                  <SpeakButton
                    text={pair.text}
                    language={card.language}
                    id={`para-${index}`}
                    speech={speech}
                    label={t('common.listen')}
                  />
                </li>
              ))}
            </ul>
          </li>
        ) : null}

        {lifeExamples.map((example, index) => (
          <DictExampleRow
            key={`life-${index}`}
            example={example}
            index={index}
            lemma={card.lemma}
            forms={forms}
            dictLang={dictLang ?? card.language}
            speech={speech}
            pick={pick ?? null}
          />
        ))}
      </ul>
    </section>
  );
}
