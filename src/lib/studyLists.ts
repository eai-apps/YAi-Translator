/**
 * Свои списки слов «Мои списки» (этап 8Б) — как плейлисты: человек сам собирает слова для учёбы.
 * Один список хранит id карточек из «Мои карточки», поэтому слово может быть в нескольких списках.
 * Хранение как у карточек: localStorage, у вошедшего — синхронизация (study_lists в D1).
 */
import type { StudyList } from '../../shared/study';
import { STUDY_LIST_MAX } from '../../shared/study';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';

/** Самые длинные допустимые подписи: как в проверке на сервере (functions/_lib/study/lists.ts). */
export const LIST_TITLE_MAX = 40;
export const LIST_EMOJI_MAX = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isList(value: unknown): value is StudyList {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    Array.isArray(value.cardIds) &&
    value.cardIds.every((item) => typeof item === 'string') &&
    typeof value.updatedAt === 'number' &&
    typeof value.createdAt === 'number'
  );
}

/** Чистка списков из localStorage и с сервера: битые записи не должны ломать экран. */
export function sanitizeLists(raw: unknown): StudyList[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isList)
    .map((list) => ({
      ...list,
      emoji: typeof list.emoji === 'string' ? list.emoji.slice(0, LIST_EMOJI_MAX) : '',
      title: list.title.trim().slice(0, LIST_TITLE_MAX),
      cardIds: [...new Set(list.cardIds)],
    }))
    .slice(0, STUDY_LIST_MAX);
}

export function readLists(): StudyList[] {
  return sanitizeLists(readStorage<unknown>(STORAGE_KEYS.studyLists, []));
}

export function writeLists(lists: StudyList[]): void {
  writeStorage(STORAGE_KEYS.studyLists, lists);
}

/**
 * Слияние с сервером: побеждает запись с большим updatedAt (как у карточек).
 * null — менять нечего, поэтому синхронизация не зацикливается.
 */
export function mergeLists(local: StudyList[], incoming: StudyList[] = [], removed: string[] = []): StudyList[] | null {
  const result = new Map(local.map((list) => [list.id, list] as const));
  let changed = false;
  for (const id of removed) {
    if (result.delete(id)) changed = true;
  }
  for (const list of incoming) {
    if (removed.includes(list.id)) continue;
    const existing = result.get(list.id);
    if (!existing || list.updatedAt > existing.updatedAt) {
      result.set(list.id, list);
      changed = true;
    }
  }
  return changed ? Array.from(result.values()) : null;
}

/** Id нового списка: время + случайные буквы — одинаковых не бывает и на двух устройствах. */
export function newListId(): string {
  return `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Название и значок из ввода: длинное обрезаем, пустое название не принимаем. */
export function makeList(title: string, emoji: string, now = Date.now()): StudyList | null {
  const clean = title.trim().slice(0, LIST_TITLE_MAX);
  if (!clean) return null;
  return {
    id: newListId(),
    title: clean,
    emoji: emoji.trim().slice(0, LIST_EMOJI_MAX),
    cardIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
