/**
 * Хук статуса и ручного запуска синхронизации (этап 20).
 * Даёт кнопку «Синхронизировать сейчас» и время последней синхронизации.
 */
import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config';
import { readStorage } from '../lib/storage';

export function useSyncStatus() {
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => {
    const val = Number(readStorage<number>(STORAGE_KEYS.lastSyncTime, 0));
    return val > 0 ? val : null;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const onSuccess = (event: Event) => {
      const custom = event as CustomEvent<{ time: number }>;
      const time = custom.detail?.time || Date.now();
      setLastSyncTime(time);
      setIsSyncing(false);
    };

    window.addEventListener('yai:sync-success', onSuccess);
    return () => window.removeEventListener('yai:sync-success', onSuccess);
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    window.dispatchEvent(new CustomEvent('yai:sync-now'));

    // Гарантируем сброс состояния загрузки через 1.5 секунды, если события не было
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    const current = Number(readStorage<number>(STORAGE_KEYS.lastSyncTime, 0));
    if (current > 0) setLastSyncTime(current);

    setIsSyncing(false);
  }, []);

  return { lastSyncTime, isSyncing, syncNow };
}
