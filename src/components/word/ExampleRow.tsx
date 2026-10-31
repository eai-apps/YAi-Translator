/**
 * Примеры в карточке слова: строка примера от ИИ и строка примера из словарей
 * (этап 8Б: выделено из ExamplesList.tsx, чтобы файлы оставались короткими).
 * Показывают перевод, 🔊, подпись уровня/источника и подсветку искомого слова;
 * нажатие на предложение переводит его целиком (передаётся через pick).
 */
import { useTranslation } from 'react-i18next';
import type { DictExample, LanguageCode, WordExample } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { splitHighlight } from '../../lib/exampleHighlight';
import { SpeakButton } from '../ui/SpeakButton';
import { HighlightedText } from './HighlightedText';

interface RowProps {
  speech: SpeechController;
  /** Нажатие на предложение — перевести его целиком; null — предложение не нажимается. */
  pick: ((value: string) => void) | null;
}

/** Пример от ИИ: уровень A1–B2, подсветка искомого слова в обоих предложениях. */
export function AiExampleRow({
  example,
  index,
  forms,
  lemma,
  language,
  translationLang,
  speech,
  pick,
}: RowProps & {
  example: WordExample;
  index: number;
  forms: string[];
  lemma: string;
  language: LanguageCode;
  translationLang: LanguageCode | null;
}) {
  const { t } = useTranslation();
  const partsSource = splitHighlight(example.text, {
    slice: example.match?.source,
    forms: language === 'de' ? forms : [],
    lemma,
  });
  const partsTarget = splitHighlight(example.translation, { slice: example.match?.target, forms: [], lemma: null });

  return (
    <li className="rounded-xl border border-line px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {pick ? (
              <button
                type="button"
                onClick={() => pick(example.text)}
                className="text-left hover:underline hover:decoration-dotted hover:underline-offset-4"
              >
                <HighlightedText parts={partsSource} />
              </button>
            ) : (
              <HighlightedText parts={partsSource} />
            )}
          </p>
          {example.translation ? (
            <p
              dir={translationLang ? textDirection(translationLang) : 'auto'}
              className="mt-0.5 text-sm leading-relaxed text-muted"
            >
              <HighlightedText parts={partsTarget} />
            </p>
          ) : null}
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">{example.level}</p>
        </div>
        <SpeakButton
          text={example.text}
          language={language}
          id={`example-ai-${index}`}
          speech={speech}
          label={t('common.listen')}
        />
      </div>
    </li>
  );
}

/** Пример «из жизни» (Tatoeba / Wiktionary): подпись источника — ссылка на сайт. */
export function DictExampleRow({
  example,
  index,
  lemma,
  forms,
  dictLang,
  speech,
  pick,
}: RowProps & {
  example: DictExample;
  index: number;
  lemma: string;
  forms: string[];
  dictLang: LanguageCode;
}) {
  const { t } = useTranslation();
  const partsSource = splitHighlight(example.text, { forms, lemma });

  return (
    <li className="rounded-xl border border-line px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p dir={textDirection(dictLang)} className="text-sm font-medium leading-relaxed">
            {pick ? (
              <button
                type="button"
                onClick={() => pick(example.text)}
                className="text-left hover:underline hover:decoration-dotted hover:underline-offset-4"
              >
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
            {example.source === 'tatoeba' ? t('dict.fromTatoeba') : t('dict.fromWiktionary')}
          </a>
        </div>
        <SpeakButton
          text={example.text}
          language={dictLang}
          id={`life-${index}`}
          speech={speech}
          label={t('common.listen')}
        />
      </div>
    </li>
  );
}
