/**
 * Вкладка «Грамматика» (этап 8Б): 3–5 пунктов про это слово, как в хорошем учебнике —
 * заголовок, объяснение на языке интерфейса и 2–4 примера уровней A1–B2.
 * Названия тем (Akkusativ, Perfekt…) остаются ссылками на справочник, искомое слово подсвечено,
 * предложение нажимается (переводится), у каждого — 🔊.
 * Без поля grammar (старые карточки в кэше) показываются прежние короткие пояснения grammarNotes.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordCard } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { knownWordForms, splitHighlight } from '../../lib/exampleHighlight';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';
import { GrammarLinkedInline } from '../grammar/GrammarLinkedText';
import { GrammarTopicLinks } from '../grammar/GrammarTopicLinks';
import { HighlightedText } from './HighlightedText';
import { usePick } from './pick';

interface GrammarSectionProps {
  card: WordCard;
  speech: SpeechController;
  /** Язык переводов (для направления текста перевода). */
  translationLang?: LanguageCode | null;
}

export function GrammarSection({ card, speech, translationLang = null }: GrammarSectionProps) {
  const { t } = useTranslation();
  const pick = usePick();
  const points = card.grammar ?? [];
  const forms = useMemo(() => knownWordForms(card), [card]);

  return (
    <section className="space-y-4">
      {points.length > 0 ? (
        points.map((point, index) => (
          <div key={`${point.title}-${index}`}>
            <h4 className="text-sm font-semibold">
              <GrammarLinkedInline text={point.title} />
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              <GrammarLinkedInline text={point.explanation} />
            </p>

            {point.examples.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {point.examples.map((example, exampleIndex) => {
                  const parts = splitHighlight(example.text, { forms, lemma: card.lemma });
                  return (
                    <li key={`${index}-${exampleIndex}`} className="rounded-xl border border-line px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-relaxed">
                            {pick ? (
                              <button
                                type="button"
                                onClick={() => pick(example.text)}
                                className="text-left hover:underline hover:decoration-dotted hover:underline-offset-4"
                              >
                                <HighlightedText parts={parts} />
                              </button>
                            ) : (
                              <HighlightedText parts={parts} />
                            )}
                          </p>
                          {example.translation ? (
                            <p
                              dir={translationLang ? textDirection(translationLang) : 'auto'}
                              className="mt-0.5 text-sm leading-relaxed text-muted"
                            >
                              {example.translation}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">{example.level}</p>
                        </div>
                        <SpeakButton
                          text={example.text}
                          language={card.language}
                          id={`grammar-${index}-${exampleIndex}`}
                          speech={speech}
                          label={t('common.listen')}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ))
      ) : (
        <>
          <SectionTitle>{t('word.grammarNotes')}</SectionTitle>
          <ul className="mt-2 space-y-1.5">
            {card.grammarNotes.map((note, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  <GrammarLinkedInline text={note} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Внизу — темы справочника, к которым относится слово (этап 5). */}
      <GrammarTopicLinks topics={card.grammarTopics ?? []} />
    </section>
  );
}
