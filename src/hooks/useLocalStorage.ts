/** Хук для значения в localStorage с безопасным чтением и записью. */
import { useCallback, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import { markSettingsChanged } from '../lib/settingsSync';
import { STORAGE_KEYS } from '../config';

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    readStorage<T>(key, typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue),
  );

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  useEffect(() => {
    const reload = () => setValue(readStorage<T>(key, typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue));
    window.addEventListener('storage', reload);
    return () => window.removeEventListener('storage', reload);
  }, [key]);

  const update = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) => (typeof next === 'function' ? (next as (p: T) => T)(previous) : next));
    if ([STORAGE_KEYS.sourceLang, STORAGE_KEYS.targetLang, STORAGE_KEYS.provider].some(item => item === key)) markSettingsChanged();
  }, [key]);

  return [value, update] as const;
}
