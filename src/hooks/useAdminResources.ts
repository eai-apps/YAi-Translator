/** Загрузка и действия вкладки «Ресурсы» админки. */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminResourcesResponse, ResourceInput } from '../../shared/types';
import { api } from '../api/client';

export function useAdminResources(onError: (message: string | null) => void) {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminResourcesResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.adminResources());
      onError(null);
    } catch {
      onError(t('admin.loadError'));
    }
  }, [onError, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Общий вызов действия: блокирует кнопки и перечитывает список. */
  const run = useCallback(
    async (key: string, action: () => Promise<AdminResourcesResponse>): Promise<boolean> => {
      setBusy(key);
      try {
        setData(await action());
        return true;
      } catch {
        onError(t('admin.loadError'));
        return false;
      } finally {
        setBusy(null);
      }
    },
    [onError, t],
  );

  const save = (item: ResourceInput, id?: number) =>
    run(`save-${id ?? 'new'}`, () =>
      id === undefined
        ? api.adminResourceAction({ action: 'add', ...item })
        : api.adminResourceAction({ action: 'update', id, ...item }),
    );

  const remove = (id: number) => run(`delete-${id}`, () => api.adminResourceAction({ action: 'delete', id }));

  const toggleHidden = (id: number, hidden: boolean) =>
    run(`hidden-${id}`, () => api.adminResourceAction({ action: hidden ? 'hide' : 'show', id }));

  const move = (id: number, direction: 'up' | 'down') =>
    run(`move-${id}`, () => api.adminResourceAction({ action: 'move', id, direction }));

  const setShowInApps = (value: boolean) =>
    run('showInApps', () => api.adminResourceAction({ action: 'showInApps', value }));

  return { data, busy, save, remove, toggleHidden, move, setShowInApps, reload: load };
}
