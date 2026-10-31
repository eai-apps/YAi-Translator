/**
 * Проверка обновления APK (только приложение Android).
 * Экраны приложения грузятся прямо с сайта (capacitor.config.ts → server.url), поэтому обновляются сами.
 * Новый APK нужен только при изменении нативной части: тогда versionCode в public/version.json больше,
 * чем у установленного приложения (App.getInfo().build = versionCode из android/app/build.gradle).
 */
import { App as CapApp } from '@capacitor/app';
import { ANDROID_VERSION_CODE, APP_VERSION } from '../config';
import type { AppUpdateInfo } from '../components/app/AppUpdateModal';

export const VERSION_URL = 'https://yai-translator.pages.dev/version.json';
/** Событие «показать окно обновления» (кнопка «Проверить обновления» в профиле). */
export const APP_UPDATE_EVENT = 'yai:app-update';

export interface InstalledApp {
  /** versionCode установленного APK. */
  code: number;
  /** versionName установленного APK. */
  name: string;
}

export async function installedApp(): Promise<InstalledApp> {
  try {
    const info = await CapApp.getInfo();
    const code = Number.parseInt(info.build, 10);
    return { code: Number.isFinite(code) ? code : ANDROID_VERSION_CODE, name: info.version || APP_VERSION };
  } catch {
    return { code: ANDROID_VERSION_CODE, name: APP_VERSION };
  }
}

export interface UpdateCheck {
  installed: InstalledApp;
  latest: AppUpdateInfo | null;
  hasUpdate: boolean;
}

/** null — нет интернета или сайт не ответил. */
export async function checkAppUpdate(): Promise<UpdateCheck | null> {
  const installed = await installedApp();
  try {
    const res = await fetch(`${VERSION_URL}?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const latest = (await res.json()) as AppUpdateInfo;
    const hasUpdate = typeof latest?.versionCode === 'number' && latest.versionCode > installed.code;
    return { installed, latest, hasUpdate };
  } catch {
    return null;
  }
}
