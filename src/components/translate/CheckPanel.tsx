/** Проверка немецкого текста: исправления и объяснение каждой ошибки. */
import { useTranslation } from 'react-i18next';
import type { CheckResponse } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import type { TranslatorError } from '../../hooks/useTranslator';
import { correctionTypeKey } from '../../lib/labels';
import { AsyncPanel } from '../ui/AsyncPanel';
import { Badge } from '../ui/Badge';
import { CopyButton } from '../ui/CopyButton';
import { SectionTitle } from '../ui/SectionTitle';
import { SpeakButton } from '../ui/SpeakButton';
import { IconCheck } from '../layout/icons';

interface CheckPanelProps {
  data: CheckResponse | null;
  loading: boolean;
  error: TranslatorError | null;
  speech: SpeechController;
  onClose: () => void;
  onRetry: () => void;
}

export function CheckPanel({ data, loading, error, speech, onClose, onRetry }: CheckPanelProps) {
  const { t } = useTranslation();

  return (
    <AsyncPanel
      title={t('check.title')}
      subtitle={t('check.subtitle')}
      loading={loading}
      error={error}
      onClose={onClose}
      onRetry={onRetry}
    >
      {data ? (
        <div className="space-y-5">
          {data.isCorrect ? (
            <div className="flex items-center gap-2 rounded-xl bg-soft px-3 py-3 text-success">
              <IconCheck className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{t('check.allGood')}</p>
            </div>
          ) : null}

          <section>
            <SectionTitle>{t('check.corrected')}</SectionTitle>
            <div className="mt-2 rounded-xl bg-soft px-3 py-2.5">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {data.correctedText}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <CopyButton text={data.correctedText} />
                <SpeakButton
                  text={data.correctedText}
                  language="de"
                  id="check-corrected"
                  speech={speech}
                  label={t('common.listen')}
                />
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>{t('check.corrections')}</SectionTitle>
            {data.corrections.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t('check.noCorrections')}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.corrections.map((correction, index) => (
                  <li key={index} className="rounded-xl border border-line px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{t(correctionTypeKey(correction.type))}</Badge>
                      {correction.original ? (
                        <span className="text-sm text-muted line-through">{correction.original}</span>
                      ) : null}
                      <span className="text-muted">→</span>
                      <span className="text-sm font-medium text-success">{correction.corrected}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{correction.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.encouragement ? (
            <p className="text-sm italic text-muted">{data.encouragement}</p>
          ) : null}
        </div>
      ) : null}
    </AsyncPanel>
  );
}
