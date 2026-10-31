/**
 * Бонус «Суперточного перевода (ИИ Pro)» (0.10.2): 3 лёгких примера с переводом и один цепляющий совет.
 * Выделено мягким фиолетово-синим фоном, чтобы было видно: это возможность Pro.
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, TranslateResponse } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { SpeakButton } from '../ui/SpeakButton';

interface ProExtrasProps {
  pro: NonNullable<TranslateResponse['pro']>;
  targetLang: LanguageCode;
  speech: SpeechController;
}

export function ProExtras({ pro, targetLang, speech }: ProExtrasProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 via-[#8b7bff]/10 to-[#c06cf0]/10 p-3 sm:p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
        <span aria-hidden="true">✦</span>
        {t('translate.proExtrasTitle')}
      </p>
      {pro.examples.length > 0 ? (
        <ul className="space-y-2">
          {pro.examples.map((example, index) => (
            <li key={`${example.text}-${index}`} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-snug text-ink">{example.text}</p>
                {example.translation ? <p className="text-sm leading-snug text-muted">{example.translation}</p> : null}
              </div>
              <SpeakButton text={example.text} language={targetLang} id={`pro-${index}`} speech={speech} />
            </li>
          ))}
        </ul>
      ) : null}
      {pro.tip ? (
        <p className="mt-3 rounded-lg bg-card/70 px-3 py-2 text-sm leading-relaxed text-ink">
          <span aria-hidden="true">💡 </span>
          {pro.tip}
        </p>
      ) : null}
    </div>
  );
}
