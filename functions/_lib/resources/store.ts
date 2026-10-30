/**
 * Полезные ресурсы (таблица resources) — общий код для публичного /api/resources и админки.
 * Таблица создаётся автоматически (schema.ts) и миграцией migrations/0004_resources.sql.
 */
import type { LanguageCode, ResourceCategory, ResourceItem } from '../../../shared/types';
import { isLanguageCode } from '../../../shared/languages';
import { RESOURCES } from '../config';
import type { Env } from '../env';
import { readSetting, writeSetting } from '../settings';
import { ensureSchema } from '../schema';
import { RESOURCES_SEED_SQL } from './seed';

/** Строка таблицы resources (имена колонок в SQL). */
export interface ResourceRow {
  id: number;
  lang: string;
  category: string;
  title: string;
  url: string;
  description_ru: string;
  description_de: string;
  description_en: string;
  sort: number;
  hidden: number;
}

export function toResourceItem(row: ResourceRow): ResourceItem {
  return {
    id: row.id,
    lang: row.lang as LanguageCode,
    category: row.category as ResourceCategory,
    title: row.title,
    url: row.url,
    descriptionRu: row.description_ru,
    descriptionDe: row.description_de,
    descriptionEn: row.description_en,
    sort: row.sort,
    hidden: Boolean(row.hidden),
  };
}

/**
 * Первый запуск: заливаем начальный набор ссылок (seed.ts). Флаг в settings ставится один раз,
 * поэтому если админ потом удалит все ссылки, они не вернутся сами.
 */
async function seedResourcesOnce(env: Env): Promise<void> {
  if (!env.DB) return;
  try {
    const flag = await env.DB.prepare("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('resources_seeded', '1', ?)").bind(Date.now()).run();
    if (!flag.meta.changes) return;
    const existing = await env.DB.prepare('SELECT COUNT(*) AS n FROM resources').first<{ n: number }>();
    if ((existing?.n ?? 0) > 0) return;
    await env.DB.prepare(RESOURCES_SEED_SQL).run();
  } catch (error) {
    console.warn('resources seed failed', error);
  }
}

/** Все ресурсы, включая скрытые (админка). */
export async function listResources(env: Env, onlyVisible: boolean): Promise<ResourceItem[]> {
  if (!env.DB) return [];
  await ensureSchema(env);
  await seedResourcesOnce(env);
  const sql = `SELECT * FROM resources ${onlyVisible ? 'WHERE hidden = 0' : ''} ORDER BY lang ASC, sort ASC, id ASC LIMIT ?`;
  const result = await env.DB.prepare(sql).bind(RESOURCES.maxItems).all<ResourceRow>();
  return (result.results ?? []).map(toResourceItem);
}

/** Порядок языков как в списке продукта (de, ru, uk, en …): для группировки на странице. */
export function orderLanguages(langs: LanguageCode[], order: readonly LanguageCode[]): LanguageCode[] {
  const unique = [...new Set(langs)];
  return unique.sort((left, right) => order.indexOf(left) - order.indexOf(right));
}

/** Следующий номер сортировки в группе «язык + группа». */
export async function nextSort(env: Env, lang: string, category: string): Promise<number> {
  if (!env.DB) return 10;
  const row = await env.DB.prepare('SELECT MAX(sort) AS max_sort FROM resources WHERE lang = ? AND category = ?')
    .bind(lang, category)
    .first<{ max_sort: number | null }>();
  return (row?.max_sort ?? 0) + 10;
}

/** Переключатель «Показывать ресурсы в приложениях из магазинов» (по умолчанию да). */
export async function readShowInApps(env: Env): Promise<boolean> {
  const stored = await readSetting<boolean>(env, RESOURCES.showInAppsSetting);
  // До первого сохранения в админке ресурсы показываются везде.
  return stored !== false;
}

export async function writeShowInApps(env: Env, value: boolean): Promise<void> {
  await writeSetting(env, RESOURCES.showInAppsSetting, value);
}

/** Проверка ссылки: только http/https и разумная длина. */
export function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > RESOURCES.maxUrlLength) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Текст описания без лишних пробелов. */
export function normalizeText(raw: unknown, maxLength: number): string {
  return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

export function isLanguage(value: unknown): value is LanguageCode {
  return isLanguageCode(value);
}
