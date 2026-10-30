/** Альтернативные переводы: нейтральный, разговорный, официальный. */
import { useTranslation } from 'react-i18next';
import type { AlternativeTranslation, LanguageCode } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { SpeechController } from '../../hooks/useSpeech';
import { translationStyleKey } from '../../lib/labels';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';

interface AlternativesListProps {
  alternatives: AlternativeTranslation[];
  targetLang: LanguageCode;
  speech: SpeechController;
}

export function AlternativesList({ alternatives, targetLang, speech }: AlternativesListProps) {
  const { t } = useTranslation();
  if (alternatives.length === 0) return null;

  return (
    <section className="mt-5 border-t border-line pt-4">
      <SectionTitle>{t('translate.alternatives')}</SectionTitle>
      <ul className="mt-2 space-y-2">
        {alternatives.map((alternative, index) => (
          <li key={`${alternative.style}-${index}`} className="rounded-xl bg-soft p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge tone="accent">{t(translationStyleKey(alternative.style))}</Badge>
                <p
                  dir={textDirection(targetLang)}
                  className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed"
                >
                  {alternative.text}
                </p>
              </div>
              <SpeakButton
                text={alternative.text}
                language={targetLang}
                id={`alternative-${index}`}
                speech={speech}
                label={t('translate.speakResult')}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
