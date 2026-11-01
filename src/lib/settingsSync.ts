/**
 * Синхронизация пользовательских настроек (этап 20).
 * Сохраняет тему, язык интерфейса, переключатели перевода, языковые пары и цель учёбы.
 * Конфликты разрешаются по правилу «последнее изменение побеждает» (updatedAt).
 */
import { isLanguageCode, isUiLanguage } from '../../shared/languages';
import type { TranslateSettings } from './translateSettings';
import { DEFAULT_TRANSLATE_SETTINGS } from './translateSettings';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from './storage';

export interface SyncedSettingsPayload {
  theme?: string;
  uiLanguage?: string;
  translateSettings?: Partial<TranslateSettings>;
  sourceLang?: string;
  targetLang?: string;
  provider?: string;
  studyGoal?: number;
  studyNewPerDay?: number;
  updatedAt: number;
}

export const SETTINGS_ITEM_ID = 'user:settings';

/** Читает текущие локальные настройки и отметку времени изменения. */
export function readLocalSettings(): SyncedSettingsPayload {
  const updatedAt = Number(readStorage<number>(STORAGE_KEYS.settingsUpdatedAt, 0)) || 0;
  return {
    theme: readStorage<string>(STORAGE_KEYS.theme, 'system'),
    uiLanguage: readStorage<string>(STORAGE_KEYS.uiLanguage, 'ru'),
    translateSettings: readStorage<Partial<TranslateSettings>>(STORAGE_KEYS.translateSettings, {}),
    sourceLang: readStorage<string>(STORAGE_KEYS.sourceLang, 'de'),
    targetLang: readStorage<string>(STORAGE_KEYS.targetLang, 'ru'),
    provider: readStorage<string>(STORAGE_KEYS.provider, 'auto'),
    studyGoal: readStorage<number>(STORAGE_KEYS.studyGoal, 10),
    studyNewPerDay: readStorage<number>(STORAGE_KEYS.studyNewPerDay, 5),
    updatedAt,
  };
}

/** Отмечает локальное изменение настроек текущим временем. */
export function markSettingsChanged(): number {
  const now = Date.now();
  writeStorage(STORAGE_KEYS.settingsUpdatedAt, now);
  window.dispatchEvent(new CustomEvent('yai:local-settings-changed', { detail: { time: now } }));
  return now;
}

/**
 * Применяет настройки с сервера, если они новее локальных.
 * Возвращает true, если настройки обновились.
 */
export function applyRemoteSettings(payloadText: string, remoteUpdatedAt: number): boolean {
  const localUpdatedAt = Number(readStorage<number>(STORAGE_KEYS.settingsUpdatedAt, 0)) || 0;
  if (!Number.isFinite(remoteUpdatedAt) || remoteUpdatedAt <= localUpdatedAt) {
    return false; // Локальные настройки свежее или такие же
  }

  try {
    const remote = JSON.parse(payloadText) as Partial<SyncedSettingsPayload>;
    if (!remote || typeof remote !== 'object') return false;

    if (['light', 'dark', 'system'].includes(remote.theme ?? '')) writeStorage(STORAGE_KEYS.theme, remote.theme);
    else delete remote.theme;
    if (isUiLanguage(remote.uiLanguage)) writeStorage(STORAGE_KEYS.uiLanguage, remote.uiLanguage);
    if (remote.translateSettings && typeof remote.translateSettings === 'object') {
      const clean: Partial<TranslateSettings> = {};
      for (const key of Object.keys(DEFAULT_TRANSLATE_SETTINGS) as (keyof TranslateSettings)[]) {
        const value = remote.translateSettings[key];
        if (key === 'aiCardMode') {
          if (value === 'site' || value === 'auto' || value === 'button') clean.aiCardMode = value;
        } else if (typeof value === 'boolean') clean[key] = value;
      }
      remote.translateSettings = clean;
      writeStorage(STORAGE_KEYS.translateSettings, clean);
    }
    if (remote.sourceLang === 'auto' || isLanguageCode(remote.sourceLang)) writeStorage(STORAGE_KEYS.sourceLang, remote.sourceLang);
    if (isLanguageCode(remote.targetLang)) writeStorage(STORAGE_KEYS.targetLang, remote.targetLang);
    if (remote.provider) writeStorage(STORAGE_KEYS.provider, remote.provider);
    if ([5, 10, 20].includes(remote.studyGoal ?? 0)) writeStorage(STORAGE_KEYS.studyGoal, remote.studyGoal);
    if (typeof remote.studyNewPerDay === 'number' && remote.studyNewPerDay >= 1 && remote.studyNewPerDay <= 50) writeStorage(STORAGE_KEYS.studyNewPerDay, remote.studyNewPerDay);

    writeStorage(STORAGE_KEYS.settingsUpdatedAt, remoteUpdatedAt);

    // Уведомляем React-компоненты об обновлении
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('yai:remote-settings-applied', { detail: remote }));
    return true;
  } catch {
    return false;
  }
}
