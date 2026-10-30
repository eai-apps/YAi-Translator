/** Журнал действий админов: последние записи таблицы admin_log. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminLogItem } from '../../../shared/types';
import { api } from '../../api/client';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

export function AdminLog({ refreshKey }: { refreshKey: number }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<AdminLogItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .adminLog(controller.signal)
      .then((data) => setItems(data.items))
      .catch(() => undefined);
    return () => controller.abort();
  }, [refreshKey]);

  return (
    <Card className="p-4">
      <SectionTitle>{t('admin.settings.logTitle')}</SectionTitle>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t('admin.users.noLog')}</p>
      ) : (
        <ul className="mt-2 max-h-72 divide-y divide-line overflow-y-auto">
          {items.map((item, index) => (
            <li key={`${item.at}-${index}`} className="flex flex-wrap items-baseline gap-x-2 py-1.5 text-xs">
              <time className="tabular-nums text-muted" dateTime={new Date(item.at).toISOString()}>
                {new Intl.DateTimeFormat(i18n.language, {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(item.at))}
              </time>
              <span className="font-medium">{item.login}</span>
              <span className="text-muted">{item.action}</span>
              {item.details ? <span className="text-muted">· {item.details}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
