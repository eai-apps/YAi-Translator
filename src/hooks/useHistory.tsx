/** История переводов и избранное. Хранится только в браузере (localStorage). */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LanguageCode, SourceLanguage } from '../../shared/types';
import { HISTORY_LIMIT, HISTORY_STORAGE_LIMIT, STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';

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

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>(() =>
    readStorage<HistoryItem[]>(STORAGE_KEYS.history, []).filter(
      (item) => typeof item?.text === 'string' && typeof item?.translation === 'string',
    ),
  );

  // Любое изменение сразу сохраняем: история должна пережить перезагрузку.
  useEffect(() => {
    writeStorage(STORAGE_KEYS.history, items);
  }, [items]);

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
