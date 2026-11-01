/**
 * История «Спросить у AI» (версия 0.6.0).
 * Без входа — только в браузере (localStorage). Вошёл в аккаунт — история ещё и синхронизируется
 * вместе с избранным: те же вопросы на всех устройствах.
 */
import { useCallback, useEffect, useState } from 'react';
import type { AskResponse, UiLanguage } from '../../shared/types';
import { STORAGE_KEYS, SYNC_MARKS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import { useAccount } from './useAccount';
import { useHistorySync } from './useHistorySync';

/** Сколько вопросов помним (совпадает с ASK.historyLimit на сервере). */
const ASK_HISTORY_LIMIT = 200;

/** Один заданный вопрос с сохранённым ответом. */
export interface AskHistoryItem {
  id: string;
  question: string;
  /** Язык, на котором получен ответ. */
  uiLang: UiLanguage;
  answer: AskResponse | null;
  createdAt: number;
  deleted?: boolean;
}

function createId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAskItem(value: AskHistoryItem): boolean {
  return typeof value?.question === 'string' && typeof value?.createdAt === 'number';
}

/** Запись с сервера о вопросе ИИ (у записи истории перевода нет поля question). */
function parseAskItem(payload: string): AskHistoryItem | null {
  try {
    const value = JSON.parse(payload) as AskHistoryItem;
    return isAskItem(value) && typeof value.id === 'string' ? value : null;
  } catch {
    return null;
  }
}

/** Сколько хранить: последние вопросы, а старые ответы не копим бесконечно. */
function trim(items: AskHistoryItem[]): AskHistoryItem[] {
  return [...items].sort((left, right) => right.createdAt - left.createdAt).slice(0, ASK_HISTORY_LIMIT);
}

export function useAskHistory() {
  const { status } = useAccount();
  const signedIn = status === 'signedIn';
  const [items, setItems] = useState<AskHistoryItem[]>(() =>
    readStorage<AskHistoryItem[]>(STORAGE_KEYS.askHistory, []).filter(isAskItem),
  );

  useEffect(() => {
    writeStorage(STORAGE_KEYS.askHistory, items);
  }, [items]);

  useEffect(() => {
    const reload = () => setItems(readStorage<AskHistoryItem[]>(STORAGE_KEYS.askHistory, []).filter(isAskItem));
    window.addEventListener('yai:data-imported', reload);
    return () => window.removeEventListener('yai:data-imported', reload);
  }, []);

  // Сервер хранит записи вместе с избранным; формат совпадает (id, payload, updatedAt).
  const onMerge = useCallback(
    ({ items: remote, tombstones }: { items: AskHistoryItem[] | null; tombstones: Record<string, number> }) => {
      if (!remote) return;
      setItems(trim(remote.filter((item) => !tombstones[item.id])));
    },
    [],
  );
  const onError = useCallback(() => undefined, []);

  useHistorySync({ signedIn, items, marksKey: SYNC_MARKS.ask, parse: parseAskItem, onMerge, onError });

  /** Новый вопрос: тот же текст вопроса заменяет старую запись. */
  const add = useCallback((question: string, uiLang: UiLanguage, answer: AskResponse | null) => {
    const id = createId();
    setItems((previous) =>
      trim([
        { id, question, uiLang, answer, createdAt: Date.now() },
        ...previous.filter((item) => item.question.trim().toLowerCase() !== question.trim().toLowerCase()),
      ]),
    );
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, clear };
}
