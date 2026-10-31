/**
 * Модальное окно выбора/добавления моделей для платного подключения (этап 9).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaidConnectionItem, PaidModelOption } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { shortModelName } from '../../hooks/useSiteAiModels';

interface Props {
  connection: PaidConnectionItem;
  onClose: () => void;
  onSave: (models: PaidModelOption[]) => Promise<void>;
  onError: (msg: string | null) => void;
}

export function AdminAddModelsModal({ connection, onClose, onSave, onError }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<PaidModelOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(connection.models.map((m) => m.id)),
  );
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.adminPaidAction<{ models: PaidModelOption[]; error?: string }>({
          action: 'fetch-models',
          id: connection.id,
        });
        if (alive) {
          setAvailable(res.models || []);
          if (res.error) onError(res.error);
        }
      } catch {
        if (alive) onError(t('admin.paid.fetchModelsError'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [connection.id, onError, t]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newModels: PaidModelOption[] = [];
      // Сначала сохраняем старые выбранные (с сохранением их данных)
      for (const m of connection.models) {
        if (selected.has(m.id)) newModels.push(m);
      }
      // Затем добавляем новые из списка доступных
      for (const m of available) {
        if (selected.has(m.id) && !newModels.some((item) => item.id === m.id)) {
          newModels.push({ ...m, enabled: true });
        }
      }
      await onSave(newModels);
      onClose();
    } catch {
      onError(t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = available.filter((m) =>
    m.id.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-card p-4 shadow-pop sm:p-5">
        <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
          <h3 className="text-base font-semibold text-ink">
            {t('admin.paid.addModelsTitle')} ({connection.name})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder={t('admin.paid.searchModels')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 h-9 w-full rounded-lg border border-line bg-soft px-3 text-sm text-ink outline-none focus:border-accent"
        />

        <div className="no-scrollbar min-h-[180px] flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">{t('common.empty')}</p>
          ) : (
            filtered.map((m) => {
              const isChecked = selected.has(m.id);
              return (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl p-2 hover:bg-soft transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 rounded accent-accent"
                    />
                    <div className="min-w-0 truncate">
                      <p className="font-medium text-ink truncate">{shortModelName(m.id)}</p>
                      <p className="text-[11px] text-muted truncate">{m.id}</p>
                    </div>
                  </div>
                  {m.priceIn !== undefined ? (
                    <span className="shrink-0 text-[11px] text-muted font-mono">
                      ${m.priceIn.toFixed(2)}/1M
                    </span>
                  ) : null}
                </label>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" variant="primary" onClick={() => void handleSave()} loading={saving}>
            {t('common.save')} ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
