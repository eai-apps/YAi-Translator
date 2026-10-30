/** Строка результата проверки ключа: ✅ «работает, ответ за N мс» или ❌ с причиной. */
import { useTranslation } from 'react-i18next';
import type { WizardCheck } from '../../hooks/useKeyWizard';
import { Spinner } from '../ui/Spinner';
import { IconCheck, IconAlert } from '../layout/icons';

interface KeyStatusProps {
  check: WizardCheck;
  latencyMs: number | null;
  message: string | null;
  savedNotice: 'account' | 'device' | null;
}

export function KeyStatus({ check, latencyMs, message, savedNotice }: KeyStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-1.5 min-h-[20px] text-xs leading-relaxed" aria-live="polite">
      {check === 'testing' ? (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Spinner className="h-3.5 w-3.5" />
          {t('keys.checking')}
        </span>
      ) : null}

      {check === 'ok' ? (
        <span className="inline-flex items-start gap-1.5 text-success">
          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {latencyMs !== null ? t('keys.checkOk', { ms: latencyMs }) : t('keys.checkOkNoTime')}
            {savedNotice === 'account' ? ` · ${t('keys.savedInAccount')}` : ''}
            {savedNotice === 'device' ? ` · ${t('keys.savedOnDevice')}` : ''}
          </span>
        </span>
      ) : null}

      {check === 'fail' ? (
        <span className="inline-flex items-start gap-1.5 text-danger">
          <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message ?? t('keys.checkFailed')}</span>
        </span>
      ) : null}
    </div>
  );
}
