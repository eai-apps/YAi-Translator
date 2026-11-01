/**
 * Хук синхронизации настроек с аккаунтом (этап 20).
 * Отправляет настройки в /api/sync как элемент 'user:settings' и применяет входящие.
 * Работает только для вошедших пользователей.
 */
import { useCallback, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { SYNC_INTERVAL_MS } from '../config';
import {
  applyRemoteSettings,
  markSettingsChanged,
  readLocalSettings,
  SETTINGS_ITEM_ID,
} from '../lib/settingsSync';

export function useSettingsSync(signedIn: boolean) {
  const running = useRef(false);
  const lastPushedTimestamp = useRef<number>(0);

  const syncSettings = useCallback(async () => {
    if (!signedIn || running.current) return;
    running.current = true;
    try {
      const local = readLocalSettings();

      // 1. Забираем настройки с сервера
      const pullResponse = await api.syncPull(0);
      const remoteItem = pullResponse.items.find((item) => item.id === SETTINGS_ITEM_ID);

      let needPush = false;
      if (remoteItem && !remoteItem.deleted) {
        if (remoteItem.updatedAt > local.updatedAt) {
          applyRemoteSettings(remoteItem.payload, remoteItem.updatedAt);
        } else if (local.updatedAt > remoteItem.updatedAt) {
          needPush = true;
        }
      } else if (local.updatedAt > 0) {
        // На сервере ещё нет сохранённых настроек пользователя
        needPush = true;
      }

      // 2. Если локальные новее или на сервере пусто — отправляем
      if (needPush && local.updatedAt !== lastPushedTimestamp.current) {
        await api.syncPush({
          items: [
            {
              id: SETTINGS_ITEM_ID,
              payload: JSON.stringify(local),
              updatedAt: local.updatedAt || markSettingsChanged(),
              deleted: false,
            },
          ],
        });
        lastPushedTimestamp.current = local.updatedAt;
      }
      window.dispatchEvent(new CustomEvent('yai:sync-success', { detail: { time: Date.now() } }));
    } catch {
      // Игнорируем сетевые сбои
    } finally {
      running.current = false;
    }
  }, [signedIn]);

  // Запуск при входе и периодически
  useEffect(() => {
    if (!signedIn) { lastPushedTimestamp.current = 0; return; }
    void syncSettings();
    const interval = window.setInterval(() => void syncSettings(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [signedIn, syncSettings]);

  // Слушаем сигнал ручной синхронизации и изменения настроек
  useEffect(() => {
    if (!signedIn) return;

    const onSyncNow = () => void syncSettings();
    let debounceTimer: number | null = null;
    const onSettingsChanged = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => void syncSettings(), 1000);
    };

    window.addEventListener('yai:sync-now', onSyncNow);
    window.addEventListener('yai:local-settings-changed', onSettingsChanged);
    return () => {
      window.removeEventListener('yai:sync-now', onSyncNow);
      window.removeEventListener('yai:local-settings-changed', onSettingsChanged);
      if (debounceTimer) window.clearTimeout(debounceTimer);
    };
  }, [signedIn, syncSettings]);
}
