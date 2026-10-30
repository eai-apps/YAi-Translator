/** «Сравнить переводчики»: один текст во всех подключённых сервисах сразу. */
import { useTranslation } from 'react-i18next';
import type { CompareResponse, LanguageCode } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import type { TranslatorError } from '../../lib/errors';
import { providerLabel } from '../../lib/errors';
import { AsyncPanel } from '../ui/AsyncPanel';
import { CopyButton } from '../ui/CopyButton';
import { SpeakButton } from '../ui/SpeakButton';

interface ComparePanelProps {
  data: CompareResponse | null;
  loading: boolean;
  error: TranslatorError | null;
  targetLang: LanguageCode;
  speech: SpeechController;
  onClose: () => void;
  onRetry: () => void;
}

export function ComparePanel({ data, loading, error, targetLang, speech, onClose, onRetry }: ComparePanelProps) {
  const { t } = useTranslation();
  return (
    <AsyncPanel
      title={t('compare.title')}
      subtitle={t('compare.subtitle')}
      loading={loading}
      error={error}
      onClose={onClose}
      onRetry={onRetry}
    >
      <ul className="space-y-2">
        {(data?.items ?? []).map((item, index) => (
          <li key={item.provider} className="rounded-xl border border-line px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {providerLabel(item.provider)}
                </p>
                <p className={item.text ? 'mt-0.5 text-sm leading-relaxed' : 'mt-0.5 text-sm text-muted'}>
                  {item.text ?? t('compare.noAnswer')}
                </p>
              </div>
              {item.text ? (
                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton text={item.text} label={t('translate.copyResult')} />
                  <SpeakButton
                    text={item.text}
                    language={targetLang}
                    id={`compare-${index}`}
                    speech={speech}
                    label={t('common.listen')}
                  />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </AsyncPanel>
  );
}
