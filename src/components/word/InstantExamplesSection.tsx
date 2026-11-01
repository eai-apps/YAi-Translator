/**
 * Блок реальных примеров предложений из Tatoeba для карточки слова (этап 15).
 * Показывает до 5 предложений с переводом на язык интерфейса, 🔊 и ссылкой на Tatoeba (CC-BY).
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { useExamples } from '../../hooks/useExamples';
import { SpeakButton } from '../ui/SpeakButton';
import { PickText } from './pick';

interface InstantExamplesSectionProps {
  lemma: string;
  lang: LanguageCode;
  speech?: SpeechController;
}

export function InstantExamplesSection({ lemma, lang, speech }: InstantExamplesSectionProps) {
  const { t, i18n } = useTranslation();
  const { examples } = useExamples(lemma, lang);
  const uiLang = (i18n.language?.slice(0, 2) as LanguageCode) || 'ru';

  if (!examples || examples.length === 0) return null;

  return (
    <section className="space-y-2 pt-2 border-t border-line">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('word.examplesTitle')}</p>
        <span className="text-[10px] text-muted">Tatoeba (CC-BY 2.0 FR)</span>
      </div>
      <ul className="space-y-2">
        {examples.map((ex) => {
          // Выбираем лучший перевод: на язык интерфейса, затем ru -> en -> de -> uk
          const tr =
            ex.tr[uiLang] ||
            (uiLang !== 'ru' ? ex.tr.ru : undefined) ||
            (uiLang !== 'en' ? ex.tr.en : undefined) ||
            (uiLang !== 'de' ? ex.tr.de : undefined) ||
            (uiLang !== 'uk' ? ex.tr.uk : undefined);

          return (
            <li key={ex.id} className="rounded-xl border border-line bg-card p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p dir={textDirection(lang)} className="text-sm font-medium leading-relaxed">
                    <PickText text={ex.text} />
                  </p>
                  {tr ? (
                    <p className="mt-0.5 text-xs text-muted leading-relaxed">{tr}</p>
                  ) : null}
                  <a
                    href={`https://tatoeba.org/sentences/show/${ex.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[10px] text-muted underline decoration-dotted hover:text-ink"
                  >
                    Tatoeba #{ex.id}
                  </a>
                </div>
                {speech ? (
                  <SpeakButton
                    text={ex.text}
                    language={lang}
                    id={`ex-tatoeba-${ex.id}`}
                    speech={speech}
                    audioUrl={ex.audio}
                    className="h-8 w-8"
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
