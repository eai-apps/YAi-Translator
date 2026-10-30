/**
 * Удалённые записи истории и избранного, которые ещё не отправлены на сервер.
 * Нужны, чтобы удаление на телефоне дошло до компьютера и не вернулось обратно.
 */
import { STORAGE_KEYS, SYNC_TOMBSTONE_LIMIT } from '../config';
import { readStorage, writeStorage } from './storage';

export type Tombstones = Record<string, number>;

export function readTombstones(): Tombstones {
  const stored = readStorage<Tombstones>(STORAGE_KEYS.syncTombstones, {});
  if (!stored || typeof stored !== 'object') return {};
  const result: Tombstones = {};
  for (const [id, time] of Object.entries(stored)) {
    if (typeof time === 'number' && Number.isFinite(time)) result[id] = time;
  }
  return result;
}

export function writeTombstones(tombstones: Tombstones): void {
  const entries = Object.entries(tombstones)
    .sort((left, right) => right[1] - left[1])
    .slice(0, SYNC_TOMBSTONE_LIMIT);
  writeStorage(STORAGE_KEYS.syncTombstones, Object.fromEntries(entries));
}
