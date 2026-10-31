/** Хук для значения в localStorage с безопасным чтением и записью. */
import { useCallback, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    readStorage<T>(key, typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue),
  );

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  const update = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) => (typeof next === 'function' ? (next as (p: T) => T)(previous) : next));
  }, []);

  return [value, update] as const;
}
