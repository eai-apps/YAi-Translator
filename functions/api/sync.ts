/**
 * GET  /api/sync?since=<ms> — избранное и история пользователя новее since
 *                             (без since — все записи).
 * PUT  /api/sync {items}     — отправка изменений. Побеждает запись с большим updated_at,
 *                             удаление передаётся как deleted = true.
 *
 * Без входа в аккаунт история, как и раньше, живёт только в localStorage.
 */
import type { SyncItem, SyncPushRequest, SyncResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { AUTH } from '../_lib/config';
import { requireSession } from '../_lib/auth/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { ensureSchema } from '../_lib/schema';

interface ItemRow {
  item_id: string;
  payload: string;
  updated_at: number;
  deleted: number;
}

function toSyncItem(row: ItemRow): SyncItem {
  return {
    id: row.item_id,
    payload: row.payload,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const session = await requireSession(env, context.request);
    if (!env.DB) throw new ApiError('INTERNAL', 500);
    await ensureSchema(env);

    const rawSince = new URL(context.request.url).searchParams.get('since');
    const since = rawSince ? Number(rawSince) : 0;
    if (!Number.isFinite(since) || since < 0) throw new ApiError('VALIDATION', 400);

    const result = await env.DB.prepare(
      'SELECT item_id, payload, updated_at, deleted FROM user_items WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC LIMIT 3000',
    )
      .bind(session.userId, Math.floor(since))
      .all<ItemRow>();

    const response: SyncResponse = {
      items: (result.results ?? []).map(toSyncItem),
      serverTime: Date.now(),
    };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const session = await requireSession(env, context.request);
    if (!env.DB) throw new ApiError('INTERNAL', 500);
    await ensureSchema(env);

    const body = await readJsonBody(context.request);
    const items = parseIntems(body);

    // Защита базы от переполнения: не больше AUTH.maxSyncItemsPerUser записей на аккаунт.
    const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM user_items WHERE user_id = ?')
      .bind(session.userId)
      .first<{ total: number }>();
    if ((count?.total ?? 0) + items.length > AUTH.maxSyncItemsPerUser) {
      await env.DB.prepare(
        `DELETE FROM user_items WHERE user_id = ? AND item_id IN (
           SELECT item_id FROM user_items WHERE user_id = ? AND deleted = 1 ORDER BY updated_at ASC LIMIT ?)`,
      )
        .bind(session.userId, session.userId, items.length)
        .run();
    }
    // Повторное обновление существующей записи не занимает место; новые id сверх лимита отклоняем.
    const uniqueIds = [...new Set(items.map(item => item.id))];
    const existingIds = new Set<string>();
    for (let start = 0; start < uniqueIds.length; start += 90) {
      const chunk = uniqueIds.slice(start, start + 90);
      const found = await env.DB.prepare(`SELECT item_id FROM user_items WHERE user_id = ? AND item_id IN (${chunk.map(() => '?').join(',')})`)
        .bind(session.userId, ...chunk).all<{ item_id: string }>();
      for (const item of found.results ?? []) existingIds.add(item.item_id);
    }
    const currentCount = await env.DB.prepare('SELECT COUNT(*) AS total FROM user_items WHERE user_id = ?')
      .bind(session.userId).first<{ total: number }>();
    if ((currentCount?.total ?? 0) + uniqueIds.filter(id => !existingIds.has(id)).length > AUTH.maxSyncItemsPerUser) {
      throw new ApiError('VALIDATION', 400);
    }
    const now = Date.now();

    const statements = items.map((item) =>
      env.DB!.prepare(
        `INSERT INTO user_items (user_id, item_id, payload, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, item_id) DO UPDATE SET
           payload = excluded.payload, updated_at = excluded.updated_at, deleted = excluded.deleted
         WHERE excluded.updated_at > user_items.updated_at`,
      ).bind(session.userId, item.id, item.payload, item.updatedAt, item.deleted ? 1 : 0),
    );
    if (statements.length) await env.DB.batch(statements);

    const response: SyncResponse = { items: [], serverTime: now };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

/** Разбирает и проверяет список изменений. */
function parseIntems(body: Record<string, unknown>): SyncItem[] {
  const raw = (body as Partial<SyncPushRequest>).items;
  if (!Array.isArray(raw)) throw new ApiError('VALIDATION', 400);
  if (raw.length > AUTH.maxSyncItemsPerRequest) throw new ApiError('VALIDATION', 400);

  const encoder = new TextEncoder();
  return raw.map((entry) => {
    const item = entry as Partial<SyncItem> | null;
    if (
      !item ||
      typeof item.id !== 'string' ||
      !item.id ||
      item.id.length > 100 ||
      typeof item.payload !== 'string' ||
      !Number.isFinite(item.updatedAt)
    ) {
      throw new ApiError('VALIDATION', 400);
    }
    if (encoder.encode(item.payload).length > AUTH.maxSyncPayloadBytes) throw new ApiError('VALIDATION', 400);
    return {
      id: item.id,
      payload: item.payload,
      updatedAt: Math.floor(item.updatedAt as number),
      deleted: item.deleted === true,
    };
  });
}
