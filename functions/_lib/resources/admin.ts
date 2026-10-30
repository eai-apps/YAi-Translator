/**
 * Действия админки с ресурсами: добавить, изменить, скрыть, показать, поменять порядок, удалить.
 * Каждое действие пишется в журнал админов и сбрасывает кэш публичного ответа.
 */
import type { AdminResourcesResponse } from '../../../shared/types';
import { isResourceCategory } from '../../../shared/dict';
import { RESOURCES } from '../config';
import type { Env } from '../env';
import { ApiError } from '../http';
import type { AdminSession } from '../admin/require';
import { logAdminAction } from '../admin/require';
import { ensureSchema } from '../schema';
import {
  isLanguage,
  listResources,
  nextSort,
  normalizeText,
  normalizeUrl,
  readShowInApps,
  writeShowInApps,
} from './store';

/** После любого изменения публичный список перечитается при следующем запросе. */
async function clearResourcesCache(env: Env): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('DELETE FROM cache WHERE key = ?').bind(RESOURCES.cacheKey).run();
}

function requireId(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new ApiError('VALIDATION', 400);
  return value;
}

/** Все поля ресурса из тела запроса; hidden допускает true/false. */
function readFields(body: Record<string, unknown>) {
  const lang = body.lang;
  const category = body.category;
  if (!isLanguage(lang)) throw new ApiError('VALIDATION', 400);
  if (!isResourceCategory(category)) throw new ApiError('VALIDATION', 400);

  // Название и адрес присылаются прямо в теле POST (а не вложенными в item), как и остальные действия.
  const title = normalizeText(body.title, RESOURCES.maxTitleLength);
  const url = normalizeUrl(body.url);
  if (!title || !url) throw new ApiError('VALIDATION', 400);

  return {
    lang,
    category,
    title,
    url,
    descriptionRu: normalizeText(body.descriptionRu, RESOURCES.maxDescriptionLength),
    descriptionDe: normalizeText(body.descriptionDe, RESOURCES.maxDescriptionLength),
    descriptionEn: normalizeText(body.descriptionEn, RESOURCES.maxDescriptionLength),
    hidden: body.hidden === true ? 1 : 0,
  };
}

/** Обработчик POST /api/admin/resources. */
export async function handleResourceAction(
  env: Env,
  admin: AdminSession,
  body: Record<string, unknown>,
): Promise<AdminResourcesResponse> {
  if (!env.DB) throw new Error('D1 недоступна');
  await ensureSchema(env);
  const action = body.action;
  console.log('Ресурсы: действие', action);

  if (action === 'add') {
    const fields = readFields(body);
    const sort = await nextSort(env, fields.lang, fields.category);
    await env.DB.prepare(
      `INSERT INTO resources (lang, category, title, url, description_ru, description_de, description_en, sort, hidden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        fields.lang,
        fields.category,
        fields.title,
        fields.url,
        fields.descriptionRu,
        fields.descriptionDe,
        fields.descriptionEn,
        sort,
        fields.hidden,
      )
      .run();
    await logAdminAction(env, admin, 'resource.add', `${fields.lang}/${fields.category}: ${fields.title}`);
  } else if (action === 'update') {
    const id = requireId(body.id);
    const fields = readFields(body);
    const result = await env.DB.prepare(
      `UPDATE resources SET lang = ?, category = ?, title = ?, url = ?, description_ru = ?,
             description_de = ?, description_en = ?, hidden = ? WHERE id = ?`,
    )
      .bind(
        fields.lang,
        fields.category,
        fields.title,
        fields.url,
        fields.descriptionRu,
        fields.descriptionDe,
        fields.descriptionEn,
        fields.hidden,
        id,
      )
      .run();
    if (!result.meta.changes) throw new ApiError('NOT_FOUND', 404);
    await logAdminAction(env, admin, 'resource.update', `${id}: ${fields.title}`);
  } else if (action === 'hide' || action === 'show') {
    const id = requireId(body.id);
    await env.DB.prepare('UPDATE resources SET hidden = ? WHERE id = ?')
      .bind(action === 'hide' ? 1 : 0, id)
      .run();
    await logAdminAction(env, admin, `resource.${action}`, String(id));
  } else if (action === 'move') {
    const id = requireId(body.id);
    const direction = body.direction === 'up' ? 'up' : 'down';
    await moveResource(env, id, direction);
    await logAdminAction(env, admin, 'resource.move', `${id} ${direction}`);
  } else if (action === 'delete') {
    const id = requireId(body.id);
    await env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(id).run();
    await logAdminAction(env, admin, 'resource.delete', String(id));
  } else if (action === 'showInApps') {
    const value = body.value === true;
    await writeShowInApps(env, value);
    await logAdminAction(env, admin, 'resource.showInApps', value ? 'on' : 'off');
  } else {
    throw new ApiError('VALIDATION', 400);
  }

  await clearResourcesCache(env);
  return { showInApps: await readShowInApps(env), items: await listResources(env, false) };
}

/** Меняет sort с соседней ссылкой в той же группе «язык + группа». */
async function moveResource(env: Env, id: number, direction: 'up' | 'down'): Promise<void> {
  if (!env.DB) return;
  const current = await env.DB.prepare('SELECT id, lang, category, sort FROM resources WHERE id = ?')
    .bind(id)
    .first<{ id: number; lang: string; category: string; sort: number }>();
  if (!current) throw new ApiError('NOT_FOUND', 404);

  const neighbor = await env.DB.prepare(
    `SELECT id, sort FROM resources WHERE lang = ? AND category = ? AND id <> ?
       AND sort ${direction === 'up' ? '<' : '>'} ?
     ORDER BY sort ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`,
  )
    .bind(current.lang, current.category, id, current.sort)
    .first<{ id: number; sort: number }>();
  if (!neighbor) return; // уже первый или последний — двигать некуда

  await env.DB.batch([
    env.DB.prepare('UPDATE resources SET sort = ? WHERE id = ?').bind(neighbor.sort, current.id),
    env.DB.prepare('UPDATE resources SET sort = ? WHERE id = ?').bind(current.sort, neighbor.id),
  ]);
}

