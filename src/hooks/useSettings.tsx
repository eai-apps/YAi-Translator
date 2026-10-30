/** Язык интерфейса и ключи пользователя. Ключи живут только на устройстве. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { UiLanguage } from '../../shared/types';
import { isUiLanguage } from '../../shared/languages';
import { STORAGE_KEYS } from '../config';
import { setApiUiLanguage } from '../api/client';
import { readStorage, writeStorage } from '../lib/storage';
import type { UserKeys } from '../lib/userKeys';
import { getUserKeys } from '../lib/userKeys';

interface SettingsContextValue {
  uiLanguage: UiLanguage;
  setUiLanguage: (language: UiLanguage) => void;
  keys: UserKeys;
  saveKey: (provider: keyof UserKeys, key: string) => void;
  removeKey: (provider: keyof UserKeys) => void;
  /** Убирает ключи с устройства (после переноса в аккаунт). */
  removeKeys: (providers: (keyof UserKeys)[]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  // Язык из localStorage читаем один раз при запуске.
  const [uiLanguage, setUiLanguageState] = useState<UiLanguage>(() => {
    const stored = readStorage<string>(STORAGE_KEYS.uiLanguage, 'ru');
    return isUiLanguage(stored) ? stored : 'ru';
  });
  const [keys, setKeys] = useState<UserKeys>(() => getUserKeys());

  // Клиент API должен знать язык интерфейса для текстов ошибок.
  useEffect(() => {
    setApiUiLanguage(uiLanguage);
  }, [uiLanguage]);

  const setUiLanguage = useCallback(
    (language: UiLanguage) => {
      setUiLanguageState(language);
      writeStorage(STORAGE_KEYS.uiLanguage, language);
      void i18n.changeLanguage(language);
    },
    [i18n],
  );

  const saveKey = useCallback((provider: keyof UserKeys, key: string) => {
    setKeys((previous) => {
      const next = { ...previous, [provider]: key.trim() };
      writeStorage(STORAGE_KEYS.keys, next);
      return next;
    });
  }, []);

  const removeKey = useCallback((provider: keyof UserKeys) => {
    setKeys((previous) => {
      const next = { ...previous, [provider]: '' };
      writeStorage(STORAGE_KEYS.keys, next);
      return next;
    });
  }, []);

  const removeKeys = useCallback((providers: (keyof UserKeys)[]) => {
    setKeys((previous) => {
      const next = { ...previous };
      for (const provider of providers) next[provider] = '';
      writeStorage(STORAGE_KEYS.keys, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ uiLanguage, setUiLanguage, keys, saveKey, removeKey, removeKeys }),
    [uiLanguage, setUiLanguage, keys, saveKey, removeKey, removeKeys],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings должен использоваться внутри SettingsProvider');
  return context;
}
