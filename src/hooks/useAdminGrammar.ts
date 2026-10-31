/** Загрузка и действия вкладки «Грамматика» админки (этап 5). */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminGrammarAction, AdminGrammarResponse } from '../../shared/types';
import { api } from '../api/client';

export function useAdminGrammar(onError: (message: string | null) => void) {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminGrammarResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.adminGrammar());
      onError(null);
    } catch {
      onError(t('admin.loadError'));
    }
  }, [onError, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Общий вызов действия: блокирует кнопку и перечитывает список. */
  const run = useCallback(
    async (key: string, action: AdminGrammarAction, failureKey: string = 'admin.loadError'): Promise<boolean> => {
      setBusy(key);
      try {
        setData(await api.adminGrammarAction(action));
        onError(null);
        return true;
      } catch {
        onError(t(failureKey));
        return false;
      } finally {
        setBusy(null);
      }
    },
    [onError, t],
  );

  return { data, busy, run, reload: load };
}
