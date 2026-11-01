/**
 * Баннер отсутствия интернета (Часть 19).
 * Информирует о доступных офлайн-функциях: словарь, учёба, разговорник, история переводов.
 */
import { Link } from 'react-router-dom';
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
      className="border-b border-line bg-soft px-4 py-2.5 text-xs text-text"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-warning font-medium">
          <IconAlert className="h-4 w-4 shrink-0" />
          <span>{t('common.offlineDetailed')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            to="/dictionary"
            className="rounded-lg border border-line bg-card px-2.5 py-1 font-medium text-text shadow-sm hover:border-accent hover:text-accent transition-colors"
          >
            {t('nav.dictionary')}
          </Link>
          <Link
            to="/learn"
            className="rounded-lg border border-line bg-card px-2.5 py-1 font-medium text-text shadow-sm hover:border-accent hover:text-accent transition-colors"
          >
            {t('nav.learn')}
          </Link>
          <Link
            to="/phrasebook"
            className="rounded-lg border border-line bg-card px-2.5 py-1 font-medium text-text shadow-sm hover:border-accent hover:text-accent transition-colors"
          >
            {t('nav.phrasebook')}
          </Link>
        </div>
      </div>
    </div>
  );
}
