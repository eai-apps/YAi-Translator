/** Тема: светлая, тёмная или как в системе. Класс .dark на <html> включает CSS-переменные. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE_KEYS } from '../config';
import { markSettingsChanged, type SyncedSettingsPayload } from '../lib/settingsSync';
import { useLocalStorage } from './useLocalStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, 'system');
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#0e1117' : '#3b6ef6');
  }, [resolvedTheme]);

  const changeTheme = useCallback((next: ThemeMode) => {
    setTheme(next);
    markSettingsChanged();
  }, [setTheme]);

  useEffect(() => {
    const onRemote = (event: Event) => {
      const custom = event as CustomEvent<Partial<SyncedSettingsPayload>>;
      if (custom.detail?.theme) {
        setTheme(custom.detail.theme as ThemeMode);
      }
    };
    window.addEventListener('yai:remote-settings-applied', onRemote);
    return () => window.removeEventListener('yai:remote-settings-applied', onRemote);
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme: changeTheme }),
    [theme, resolvedTheme, changeTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return context;
}
