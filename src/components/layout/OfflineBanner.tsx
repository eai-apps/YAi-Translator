/** Баннер отсутствия интернета. */
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { IconAlert } from './icons';

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-line bg-soft px-4 py-2 text-xs text-warning"
    >
      <IconAlert className="h-4 w-4 shrink-0" />
      <span>{t('common.offline')}</span>
    </div>
  );
}
