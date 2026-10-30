/** Значок состояния сервиса: ✅ работает или ❌ с причиной. */
import { useTranslation } from 'react-i18next';
import type { ServiceCheck } from '../../../shared/types';
import { IconAlert, IconCheck } from '../layout/icons';

interface KeyStatusProps {
  /** 'idle' — ещё не проверяли, 'testing' — проверяем, 'ok' / 'fail' — результат. */
  check: 'idle' | 'testing' | 'ok' | 'fail';
  latencyMs: number | null;
  /** Причина отказа от сервера (уже на языке интерфейса). */
  message: string | null;
  /** Короткое сообщение о сохранении. */
  savedNotice?: string | null;
}

export function KeyStatus({ check, latencyMs, message, savedNotice }: KeyStatusProps) {
  const { t } = useTranslation();

  if (check === 'idle' && !savedNotice) return null;

  return (
    <div className="mt-2 space-y-1 text-xs" role="status">
      {check === 'testing' ? <p className="text-muted">{t('keys.checking')}</p> : null}
      {check === 'ok' ? (
        <p className="flex items-center gap-1.5 text-success">
          <IconCheck className="h-3.5 w-3.5" />
          <span>
            {latencyMs !== null ? t('keys.checkOk', { ms: latencyMs }) : t('keys.checkOkNoTime')}
          </span>
        </p>
      ) : null}
      {check === 'fail' ? (
        <p className="flex items-start gap-1.5 text-danger">
          <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message ?? t('keys.checkFailed')}</span>
        </p>
      ) : null}
      {savedNotice ? <p className="text-muted">{savedNotice}</p> : null}
    </div>
  );
}

/** Превращает ответ проверки сервиса в значения для KeyStatus. */
export function checkToStatus(check: ServiceCheck): Pick<KeyStatusProps, 'check' | 'latencyMs' | 'message'> {
  return {
    check: check.ok ? 'ok' : 'fail',
    latencyMs: check.latencyMs,
    message: check.message,
  };
}
