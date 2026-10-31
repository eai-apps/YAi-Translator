/**
 * Настройки перевода (этап 8), как в Яндекс.Переводчике: история, определение языка, подсказки,
 * Enter, блок «Как переводят другие». Хранятся в localStorage (как история и избранное),
 * поэтому работают и без входа, и во всех браузерах с одинаковыми ключами STORAGE_KEYS.
 */
import type { SourceLanguage } from '../../shared/types';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';

export interface TranslateSettings {
  /** Сохранять новые переводы в историю. Избранное и карточки работают всегда. */
  saveHistory: boolean;
  /** Определять язык ввода автоматически; выключено — в поле стоит последний выбранный язык. */
  detectLanguage: boolean;
  /** Подсказки при наборе одного слова. */
  suggestions: boolean;
  /** Переводить по Enter, а не автоматически через 600 мс (Shift+Enter — новая строка). */
  enterToTranslate: boolean;
  /** Показывать блок «Как переводят другие» автоматически. */
  showOthers: boolean;
}

export const DEFAULT_TRANSLATE_SETTINGS: TranslateSettings = {
  saveHistory: true,
  detectLanguage: true,
  suggestions: true,
  enterToTranslate: false,
  showOthers: true,
};

/** Сохранённые настройки + старый отдельный ключ showOthers (совместимость). */
export function readTranslateSettings(): TranslateSettings {
  const stored = readStorage<Partial<TranslateSettings>>(STORAGE_KEYS.translateSettings, {});
  const legacyShowOthers = readStorage<boolean>(STORAGE_KEYS.showOthers, DEFAULT_TRANSLATE_SETTINGS.showOthers);
  return {
    saveHistory: typeof stored.saveHistory === 'boolean' ? stored.saveHistory : DEFAULT_TRANSLATE_SETTINGS.saveHistory,
    detectLanguage:
      typeof stored.detectLanguage === 'boolean' ? stored.detectLanguage : DEFAULT_TRANSLATE_SETTINGS.detectLanguage,
    suggestions: typeof stored.suggestions === 'boolean' ? stored.suggestions : DEFAULT_TRANSLATE_SETTINGS.suggestions,
    enterToTranslate:
      typeof stored.enterToTranslate === 'boolean'
        ? stored.enterToTranslate
        : DEFAULT_TRANSLATE_SETTINGS.enterToTranslate,
    showOthers: typeof stored.showOthers === 'boolean' ? stored.showOthers : legacyShowOthers,
  };
}

export function writeTranslateSettings(settings: TranslateSettings): void {
  writeStorage(STORAGE_KEYS.translateSettings, settings);
  // Старый ключ тоже держим в актуальном виде: его читает прежний код и синхронизация профиля.
  writeStorage(STORAGE_KEYS.showOthers, settings.showOthers);
}

/** Язык ввода по настройке «Определять язык»: выключено — последний выбранный конкретный язык. */
export function initialSourceLanguage(detectLanguage: boolean): SourceLanguage {
  const stored = readStorage<SourceLanguage>(STORAGE_KEYS.sourceLang, 'auto');
  if (detectLanguage) return stored;
  return stored !== 'auto' ? stored : 'de';
}
