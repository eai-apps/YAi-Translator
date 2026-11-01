/**
 * Вкладка «Ошибки» в панели администратора (Часть 19).
 * Показывает журнал клиентских ошибок и обращений пользователей о проблемах.
 */
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ClientErrorItem } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { IconAlert, IconTrash, IconCheck } from '../layout/icons';

export function AdminErrorsTab() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ClientErrorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadErrors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminErrors();
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // Игнорируем ошибки загрузки
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadErrors();
  }, [loadErrors]);

  const handleClear = async () => {
    if (!window.confirm(t('admin.errors.confirmClear'))) return;
    setClearing(true);
    try {
      await api.adminClearErrors();
      setItems([]);
      setTotal(0);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text">
            {t('admin.errors.title')} ({total})
          </h3>
          <p className="text-xs text-muted">
            {t('admin.errors.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={loadErrors}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
          {items.length > 0 && (
            <Button
              size="sm"
              variant="danger"
              icon={<IconTrash className="h-4 w-4" />}
              onClick={handleClear}
              disabled={clearing}
            >
              {clearing ? t('common.loading') : t('admin.errors.clear')}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted">
          <Spinner className="mr-2 h-4 w-4" />
          <span>{t('common.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <IconCheck className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm font-medium text-text">
            {t('admin.errors.noErrors')}
          </p>
          <p className="text-xs text-muted">
            {t('admin.errors.noErrorsDesc')}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isUserNote = Boolean(item.userNote);
            const dateStr = new Date(item.timestamp).toLocaleString();
            const isExpanded = expandedId === item.id;

            return (
              <Card
                key={item.id}
                className="p-3 text-xs transition-colors hover:border-lineHover"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isUserNote ? (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent">
                        {t('admin.errors.userReport')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                        <IconAlert className="h-3 w-3" />
                        {t('admin.errors.codeError')}
                      </span>
                    )}
                    <span className="text-muted">{dateStr}</span>
                    {item.appVersion && (
                      <span className="rounded bg-soft px-1 text-[11px] text-muted">
                        v{item.appVersion}
                      </span>
                    )}
                  </div>
                  {item.stack && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      {isExpanded ? t('admin.errors.hideStack') : t('admin.errors.showStack')}
                    </button>
                  )}
                </div>

                <div className="mt-2 font-mono text-xs text-text break-words">
                  {item.message}
                </div>

                {item.userNote && (
                  <div className="mt-2 rounded-lg bg-soft p-2 text-xs text-text border border-line">
                    <span className="font-semibold">{t('admin.errors.noteLabel')}: </span>
                    {item.userNote}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                  {item.url && <span className="truncate max-w-xs">URL: {item.url}</span>}
                  {item.source && (
                    <span>
                      {item.source}:{item.lineno}:{item.colno}
                    </span>
                  )}
                  {item.userAgent && (
                    <span className="truncate max-w-sm">UA: {item.userAgent}</span>
                  )}
                </div>

                {isExpanded && item.stack && (
                  <pre className="mt-2 max-h-48 overflow-x-auto rounded bg-page p-2 font-mono text-[11px] text-muted whitespace-pre-wrap">
                    {item.stack}
                  </pre>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
