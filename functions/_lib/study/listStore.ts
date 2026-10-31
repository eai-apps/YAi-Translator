/**
 * Хранение своих списков слов в D1 (этап 8Б).
 * Как у карточек: побеждает запись с большим updated_at; лишние списки удаляются по лимиту
 * аккаунта (STUDY_LIST_MAX = 100), самые старые.
 */
import type { StudyList } from '../../../shared/types';
import { STUDY_LIST_MAX } from '../../../shared/study';
import type { Env } from '../env';
import { ID_CHUNK, placeholders } from './rows';

export interface ListRow {
  list_id: string;
  payload: string;
  updated_at: number;
}

/** Снимок списка в payload; id и updated_at всегда берутся из строки. */
export function toList(row: ListRow): StudyList | null {
  try {
    const list = JSON.parse(row.payload) as StudyList;
    if (!list || typeof list.title !== 'string' || !Array.isArray(list.cardIds)) return null;
    return {
      ...list,
      id: row.list_id,
      cardIds: list.cardIds.filter((item) => typeof item === 'string'),
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}

/** Пишет присланные списки и убирает лишние, если их больше лимита. Возвращает удалённые id. */
export async function saveLists(env: Env, userId: string, lists: StudyList[]): Promise<string[]> {
  if (lists.length > 0) {
    const statements = lists.map((list) =>
      env.DB!.prepare(
        `INSERT INTO study_lists (user_id, list_id, payload, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, list_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
         WHERE excluded.updated_at > study_lists.updated_at`,
      ).bind(userId, list.id, JSON.stringify({ ...list, id: undefined, updatedAt: undefined }), list.updatedAt),
    );
    await env.DB!.batch(statements);
  }
  return trimLists(env, userId);
}

/** Новые списки (с updated_at > since) и присланные — для ответа устройству. */
export async function readLists(env: Env, userId: string, since: number, sentIds: string[]): Promise<StudyList[]> {
  const newer = await env.DB!.prepare(
    'SELECT list_id, payload, updated_at FROM study_lists WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC',
  )
    .bind(userId, since)
    .all<ListRow>();

  const sentRows: ListRow[] = [];
  for (let start = 0; start < sentIds.length; start += ID_CHUNK) {
    const part = sentIds.slice(start, start + ID_CHUNK);
    const result = await env.DB!.prepare(
      `SELECT list_id, payload, updated_at FROM study_lists WHERE user_id = ? AND list_id IN (${placeholders(part.length)})`,
    )
      .bind(userId, ...part)
      .all<ListRow>();
    sentRows.push(...(result.results ?? []));
  }

  const rows = new Map<string, ListRow>();
  for (const row of [...(newer.results ?? []), ...sentRows]) rows.set(row.list_id, row);
  return Array.from(rows.values())
    .map(toList)
    .filter((list): list is StudyList => list !== null);
}

/** Если списков больше STUDY_LIST_MAX — удаляем самые старые (по updated_at). */
async function trimLists(env: Env, userId: string): Promise<string[]> {
  const count = await env.DB!.prepare('SELECT COUNT(*) AS total FROM study_lists WHERE user_id = ?')
    .bind(userId)
    .first<{ total: number }>();
  const extra = (count?.total ?? 0) - STUDY_LIST_MAX;
  if (extra <= 0) return [];

  const rows = await env.DB!.prepare(
    'SELECT list_id FROM study_lists WHERE user_id = ? ORDER BY updated_at ASC LIMIT ?',
  )
    .bind(userId, extra)
    .all<{ list_id: string }>();
  const removed = (rows.results ?? []).map((row) => row.list_id);
  if (removed.length === 0) return [];

  const statements: D1PreparedStatement[] = [];
  for (let start = 0; start < removed.length; start += ID_CHUNK) {
    const part = removed.slice(start, start + ID_CHUNK);
    statements.push(
      env.DB!.prepare(`DELETE FROM study_lists WHERE user_id = ? AND list_id IN (${placeholders(part.length)})`).bind(
        userId,
        ...part,
      ),
    );
  }
  await env.DB!.batch(statements);
  return removed;
}
