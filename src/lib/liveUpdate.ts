/**
 * Автоматическое обновление веб-содержимого приложения «по воздуху» (этап 12):
 * - Использует @capgo/capacitor-updater в полностью ручном режиме (без облака Capgo).
 * - При старте сообщает notifyAppReady() (защита от сломанных бандлов).
 * - В фоне проверяет bundle.json на сервере Cloudflare Pages.
 * - При наличии новой версии скачивает zip-архив и готовит его к следующему запуску (не прерывает работу пользователя).
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { APP_VERSION } from '../config';
import { installedApp } from './appUpdate';

export const BUNDLE_URL = 'https://yai-translator.pages.dev/app/bundle.json';

export interface BundleManifest {
  version: string;
  url: string;
  minVersionCode?: number;
  notes?: string;
}

/** Сообщить плагину, что приложение успешно загрузилось. */
export async function notifyAppReady(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    // Игнорируем в вебе или при отсутствии плагина
  }
}

/** Проверить и загрузить обновление веб-бандла в фоне. */
export async function checkAndDownloadLiveUpdate(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    // 1. Сообщаем об успешном старте
    await notifyAppReady();

    // 2. Запрашиваем манифест бандла
    const res = await fetch(`${BUNDLE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const manifest = (await res.json()) as BundleManifest;

    if (!manifest?.version || !manifest?.url) return false;

    // 3. Проверяем минимальный versionCode установленного APK
    const app = await installedApp();
    if (manifest.minVersionCode && app.code < manifest.minVersionCode) {
      // Требуется обновление самого APK, а не только веб-бандла
      return false;
    }

    // 4. Проверяем текущую версию бандла
    const current = await CapacitorUpdater.current();
    const raw = current?.bundle?.version;
    // Встроенная сборка APK зовётся «builtin» — её версия = APP_VERSION.
    const currentVersion = !raw || raw === 'builtin' ? APP_VERSION : raw;

    if (currentVersion === manifest.version) {
      return false;
    }

    // 5. Скачиваем новый архив бандла в фоне
    const downloaded = await CapacitorUpdater.download({
      url: manifest.url,
      version: manifest.version,
    });

    if (downloaded) {
      // 6. Подготавливаем к следующему запуску (без перезагрузки экрана на лету)
      // next() — включить при следующем запуске; set() перезагрузил бы приложение прямо сейчас.
      await CapacitorUpdater.next({ id: downloaded.id });
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
