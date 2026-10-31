/**
 * Настройки перевода в приложении (этап 8). Один React-контекст на всё приложение:
 * экран перевода читает их, профиль — меняет, история спрашивает «сохранять или нет».
 * У вошедших настройки дополнительно лежат в аккаунте (см. SyncSettingsCard).
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { TranslateSettings } from '../lib/translateSettings';
import { readTranslateSettings, writeTranslateSettings } from '../lib/translateSettings';

interface TranslateSettingsContextValue {
  settings: TranslateSettings;
  /** Меняет одно поле; null — вернуть собранные с сервера настройки аккаунта. */
  update: (patch: Partial<TranslateSettings>) => void;
  replace: (next: TranslateSettings) => void;
}

const TranslateSettingsContext = createContext<TranslateSettingsContextValue | null>(null);

export function TranslateSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TranslateSettings>(() => readTranslateSettings());

  const update = useCallback((patch: Partial<TranslateSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeTranslateSettings(next);
      return next;
    });
  }, []);

  const replace = useCallback((next: TranslateSettings) => {
    const merged = { ...readTranslateSettings(), ...next };
    writeTranslateSettings(merged);
    setSettings(merged);
  }, []);

  const value = useMemo(() => ({ settings, update, replace }), [settings, update, replace]);
  return <TranslateSettingsContext.Provider value={value}>{children}</TranslateSettingsContext.Provider>;
}

export function useTranslateSettings(): TranslateSettingsContextValue {
  const context = useContext(TranslateSettingsContext);
  if (!context) throw new Error('useTranslateSettings должен использоваться внутри TranslateSettingsProvider');
  return context;
}
