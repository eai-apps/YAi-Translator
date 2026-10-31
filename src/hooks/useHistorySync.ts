/**
 * Синхронизация истории и избранного с аккаунтом.
 * Вошёл — обмен при входе, раз в минуту и после каждого изменения истории:
 * своё отправляем в PUT /api/sync, чужое забираем через GET /api/sync?since=.
 * Побеждает запись с большим updated_at. Без входа ничего не делаем.
 *
 * Этап 5: тем же путём синхронизируется история «Спросить у AI» (useAskHistory).
 * Чтобы наборы не смешивались, у каждого вида записей свои отметки отправленного,
 * а чужие записи отсекает проверка parse.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { SyncItem } from '../../shared/types';
import { api } from '../api/client';
import { STORAGE_KEYS, SYNC_INTERVAL_MS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import { readTombstones, writeTombstones } from '../lib/syncTombstones';
import type { Tombstones } from '../lib/syncTombstones';

/** Отметки отправленного (id → время): одно и то же на сервер не отправляем. */
export type SyncMarks = Record<string, number>;

/** Любая запись истории: id и время изменения. */
export interface SyncableItem {
  id: string;
  createdAt: number;
}

export interface MergePayload<T> {
  items: T[] | null;
  tombstones: Tombstones;
  since: number;
}

export interface SyncOptions<T extends SyncableItem> {
  signedIn: boolean;
  items: T[];
  /** Ключ набора в localStorage: «yai.syncMarks.history» и «yai.syncMarks.ask». */
  marksKey: string;
  /** Проверяет, что запись из базы этого вида (например, у вопроса есть question). */
  parse: (payload: string) => T | null;
  onMerge: (payload: MergePayload<T>) => void;
  onError: () => void;
}

function readMarks(key: string): SyncMarks {
  return readStorage<SyncMarks>(key, {});
}

export function useHistorySync<T extends SyncableItem>({
  signedIn,
  items,
  marksKey,
  parse,
  onMerge,
  onError,
}: SyncOptions<T>) {
  const marks = useRef<SyncMarks>(readMarks(marksKey));
  // Свежие данные для запросов, без пересоздания функций синхронизации.
  const latest = useRef({ onMerge, onError, items, parse });
  latest.current = { onMerge, onError, items, parse };
  const running = useRef(false);

  /** Отправляет на сервер только изменившееся с прошлого удачного обмена. */
  const push = useCallback(async (): Promise<void> => {
    const tombstones = readTombstones();
    const out: SyncItem[] = [];
    const sent: SyncMarks = {};

    for (const item of latest.current.items) {
      if (tombstones[item.id]) continue; // эта запись здесь удалена
      if (marks.current[item.id] === item.createdAt) continue;
      out.push({ id: item.id, payload: JSON.stringify(item), updatedAt: item.createdAt, deleted: false });
      sent[item.id] = item.createdAt;
    }

    // Удаления отправляются один раз.
    const sentDeletes: Tombstones = {};
    for (const [id, time] of Object.entries(tombstones)) {
      if (marks.current[id] === time) continue;
      out.push({ id, payload: '{}', updatedAt: time, deleted: true });
      sentDeletes[id] = time;
    }

    if (!out.length) return;

    // Пачками по 200 — ровно столько сервер принимает за один запрос.
    for (let index = 0; index < out.length; index += 200) {
      await api.syncPush({ items: out.slice(index, index + 200) });
    }

    marks.current = { ...marks.current, ...sent, ...sentDeletes };
    writeStorage(marksKey, marks.current);

    // Список удалений нужен только до подтверждения сервером.
    const left = { ...tombstones };
    for (const id of Object.keys(sentDeletes)) delete left[id];
    writeTombstones(left);
  }, [marksKey]);

  /** Забирает чужие изменения и отдаёт список записей, которые нужно показать. */
  const pull = useCallback(
    async (since: number): Promise<MergePayload<T>> => {
      const startedAt = Date.now();
      const response = await api.syncPull(since);
      const itemsById = new Map(latest.current.items.map((item) => [item.id, item] as const));
      const tombstones = readTombstones();
      let deleted = false;
      let changed = false;

      for (const remote of response.items) {
        // Запись другого вида (вопрос ИИ для истории переводов) не трогаем.
        const parsed = remote.deleted ? null : latest.current.parse(remote.payload);
        if (remote.deleted) {
          if (itemsById.has(remote.id) && !tombstones[remote.id]) {
            tombstones[remote.id] = remote.updatedAt;
            deleted = true;
          }
          continue;
        }
        if (!parsed) continue;
        // Здесь запись удалена — не воскрешаем её.
        if (tombstones[remote.id]) continue;
        const local = itemsById.get(remote.id);
        if (local && local.createdAt >= remote.updatedAt) continue;
        itemsById.set(parsed.id, parsed);
        changed = true;
      }

      if (deleted) writeTombstones(tombstones);

      return {
        items: changed ? Array.from(itemsById.values()) : null,
        tombstones,
        since: startedAt,
      };
    },
    [],
  );

  const sync = useCallback(async () => {
    if (!signedIn || running.current) return;
    running.current = true;
    try {
      await push();
      // Первый обмен начинается с текущего момента: своё уже отправлено, тянуть историю
      // целиком с сервера не нужно (записи, которых тут нет, пришли бы как «новые»).
      const stored = Number(readStorage<number>(STORAGE_KEYS.syncSince, 0)) || 0;
      const since = stored || Date.now();
      const result = await pull(since);
      writeStorage(STORAGE_KEYS.syncSince, result.since);
      latest.current.onMerge(result);
    } catch {
      latest.current.onError();
    } finally {
      running.current = false;
    }
  }, [pull, push, signedIn]);

  // После выхода отправленное забываем: новый вход начинает с чистого листа.
  useEffect(() => {
    if (!signedIn) {
      marks.current = {};
      writeStorage(marksKey, {});
    }
  }, [signedIn, marksKey]);

  // Обмен при входе, раз в минуту и после каждого изменения истории.
  const signature = items
    .map((item) => {
      const favorite = (item as { favorite?: boolean }).favorite ? 1 : 0;
      return `${item.id}:${item.createdAt}:${favorite}`;
    })
    .join(',');
  useEffect(() => {
    if (!signedIn) return;
    void sync();
    const timer = window.setInterval(() => void sync(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
    // signature меняется при любой правке истории — это и есть повод синхронизироваться.
  }, [signedIn, signature, sync]);
}
