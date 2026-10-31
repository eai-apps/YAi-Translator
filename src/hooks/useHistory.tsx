/**
 * История переводов и избранное.
 * Без входа — только в браузере (localStorage). Вошёл в аккаунт — дополнительно
 * синхронизируется с сервером, поэтому одинаково на всех устройствах.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LanguageCode, SourceLanguage } from '../../shared/types';
import { HISTORY_LIMIT, HISTORY_STORAGE_LIMIT, STORAGE_KEYS, SYNC_MARKS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import type { Tombstones } from '../lib/syncTombstones';
import { useAccount } from './useAccount';
import { useHistorySync } from './useHistorySync';

export interface HistoryItem {
  id: string;
  text: string;
  translation: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  kind: 'word' | 'text';
  article: 'der' | 'die' | 'das' | null;
  createdAt: number;
  favorite: boolean;
}

interface HistoryContextValue {
  items: HistoryItem[];
  favorites: HistoryItem[];
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'favorite'>) => string;
  toggleFavorite: (id: string) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

/** Удаляем старые записи, но никогда не выбрасываем избранное. */
function trimItems(items: HistoryItem[]): HistoryItem[] {
  const sorted = [...items].sort((left, right) => right.createdAt - left.createdAt);
  const favorites = sorted.filter((item) => item.favorite);
  const regular = sorted.filter((item) => !item.favorite).slice(0, HISTORY_LIMIT);
  return [...favorites, ...regular]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, HISTORY_STORAGE_LIMIT);
}

function createId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isHistoryItem(value: HistoryItem): boolean {
  return typeof value?.text === 'string' && typeof value?.translation === 'string';
}

/** Запись с сервера: история перевода (в ней есть текст и перевод). */
function parseHistoryItem(payload: string): HistoryItem | null {
  try {
    // Запись «Спросить у AI» проверяем по полю question — её в историю не кладём.
    if (typeof (JSON.parse(payload) as { question?: unknown }).question === 'string') return null;
  } catch {
    return null;
  }
  try {
    const value = JSON.parse(payload) as HistoryItem;
    return isHistoryItem(value) && typeof value.id === 'string' ? value : null;
  } catch {
    return null;
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { status } = useAccount();
  const signedIn = status === 'signedIn';
  const [items, setItems] = useState<HistoryItem[]>(() =>
    readStorage<HistoryItem[]>(STORAGE_KEYS.history, []).filter(isHistoryItem),
  );

  // Любое изменение сразу сохраняем: история должна пережить перезагрузку.
  useEffect(() => {
    writeStorage(STORAGE_KEYS.history, items);
  }, [items]);

  /** Сливаем записи с сервера и удаления; побеждает более новая запись. */
  const onMerge = useCallback(
    ({ items: remote, tombstones }: { items: HistoryItem[] | null; tombstones: Tombstones }) => {
      setItems((previous) => {
        const merged = remote ?? previous;
        const kept = merged.filter((item) => !tombstones[item.id]);
        return trimItems(kept);
      });
    },
    [],
  );

  // Ошибку сети не показываем: следующая минута повторит обмен сама.
  const onError = useCallback(() => undefined, []);

  useHistorySync({ signedIn, items, marksKey: SYNC_MARKS.history, parse: parseHistoryItem, onMerge, onError });

  const addItem = useCallback<HistoryContextValue['addItem']>((item) => {
    const id = createId();
    setItems((previous) => {
      // Повторный перевод того же текста заменяет старую запись, но сохраняет избранное.
      const duplicate = previous.find(
        (existing) =>
          existing.text.toLowerCase() === item.text.toLowerCase() &&
          existing.sourceLang === item.sourceLang &&
          existing.targetLang === item.targetLang,
      );
      const withoutDuplicate = previous.filter((existing) => existing !== duplicate);
      const nextItem: HistoryItem = {
        ...item,
        id,
        createdAt: Date.now(),
        favorite: duplicate?.favorite ?? false,
      };
      return trimItems([nextItem, ...withoutDuplicate]);
    });
    return id;
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setItems((previous) => previous.filter((item) => item.favorite));
  }, []);

  const favorites = useMemo(() => items.filter((item) => item.favorite), [items]);

  const value = useMemo(
    () => ({ items, favorites, addItem, toggleFavorite, removeItem, clearHistory }),
    [items, favorites, addItem, toggleFavorite, removeItem, clearHistory],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory должен использоваться внутри HistoryProvider');
  return context;
}
