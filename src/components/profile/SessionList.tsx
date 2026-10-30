/** Список устройств, где выполнен вход: «это устройство» помечено. */
import { useTranslation } from 'react-i18next';
import type { AccountSession } from '../../../shared/types';

function formatDate(timestamp: number, language: string): string {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleString(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ');
  }
}

export function SessionList({ sessions }: { sessions: AccountSession[] }) {
  const { t, i18n } = useTranslation();

  return (
    <ul className="mt-2 space-y-1.5">
      {sessions.map((session, index) => (
        <li
          key={`${session.createdAt}-${index}`}
          className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-soft px-3 py-2 text-sm"
        >
          <span className="inline-flex items-center gap-1.5">
            {session.device || t('account.unknownDevice')}
            {session.current ? (
              <span className="rounded-full bg-accentSoft px-2 py-0.5 text-[11px] font-medium text-accent">
                {t('account.thisDevice')}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-muted">{formatDate(session.lastSeenAt, i18n.language)}</span>
        </li>
      ))}
    </ul>
  );
}
