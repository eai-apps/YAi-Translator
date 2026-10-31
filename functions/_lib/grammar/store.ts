/**
 * Справочник грамматики в D1 (таблица grammar_topics, версия 0.6.0).
 * Один файл — вся работа с таблицей: список тем, чтение, сохранение, добавление, удаление.
 * Текст темы (body_json) заполняется один раз и живёт в базе, поэтому ИИ на каждый показ не тратится.
 */
import type {
  AdminGrammarTopic,
  GrammarBody,
  GrammarCategory,
  GrammarLevel,
  GrammarTopicSummary,
  LanguageCode,
} from '../../../shared/types';
import { GRAMMAR_CATEGORIES, GRAMMAR_LEVELS, isGermanGrammarSlug } from '../../../shared/grammarTopics';
import { grammarTopicLinks } from '../../../shared/grammarLinks';
import { GRAMMAR } from '../config';
import type { Env } from '../env';
import { ApiError } from '../http';
import { ensureSchema } from '../schema';
import { describeError } from '../utils';
import { GERMAN_GRAMMAR_SEED_SQL } from './seed';
import { isRecord } from '../validate/helpers';

/** Строка таблицы grammar_topics. */
export interface GrammarRow {
  slug: string;
  lang: string;
  level: string;
  category: string;
  title_ru: string;
  title_de: string;
  title_en: string;
  body_json: string;
  source: string;
  source_url: string | null;
  updated_at: number | null;
  edited_by: string | null;
}

export type GrammarSource = 'ai' | 'admin' | 'none';

/** Разбирает body_json: битый JSON или пустая строка означают «текста нет». */
export function parseBody(row: GrammarRow): GrammarBody | null {
  if (!row.body_json) return null;
  try {
    const parsed: unknown = JSON.parse(row.body_json);
    if (!isRecord(parsed) || typeof parsed.summary !== 'string') return null;
    const body = parsed as unknown as GrammarBody;
    return {
      ...body,
      // Ссылки на источники всегда наши и проверенные: из базы берём только тексты.
      links: Array.isArray(body.links) && body.links.length > 0 ? body.links : grammarTopicLinks(row.slug),
    };
  } catch {
    return null;
  }
}

function sourceOf(row: GrammarRow): GrammarSource {
  return row.source === 'ai' || row.source === 'admin' ? row.source : 'none';
}

export function toSummary(row: GrammarRow): GrammarTopicSummary {
  return {
    slug: row.slug,
    lang: (row.lang || 'de') as LanguageCode,
    level: (GRAMMAR_LEVELS as readonly string[]).includes(row.level) ? (row.level as GrammarLevel) : 'A1',
    category: (GRAMMAR_CATEGORIES as readonly string[]).includes(row.category)
      ? (row.category as GrammarCategory)
      : 'syntax',
    titleRu: row.title_ru,
    titleDe: row.title_de,
    titleEn: row.title_en,
    filled: parseBody(row) !== null,
    updatedAt: row.updated_at,
  };
}

export function toAdminTopic(row: GrammarRow): AdminGrammarTopic {
  return {
    ...toSummary(row),
    body: parseBody(row),
    source: sourceOf(row),
    sourceUrl: row.source_url,
    editedBy: row.edited_by,
  };
}

/**
 * Первый запуск: заливаем список тем (как resources на этапе 4).
 * Флаг в settings ставится один раз — удалённая в админке тема сама не вернётся.
 */
async function seedOnce(env: Env): Promise<void> {
  if (!env.DB) return;
  try {
    const flag = await env.DB.prepare(
      "INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('grammar_seeded', '1', ?)",
    )
      .bind(Date.now())
      .run();
    if (!flag.meta.changes) return;
    const existing = await env.DB.prepare('SELECT COUNT(*) AS n FROM grammar_topics').first<{ n: number }>();
    if ((existing?.n ?? 0) > 0) return;
    await env.DB.prepare(GERMAN_GRAMMAR_SEED_SQL).run();
  } catch (error) {
    console.warn('Список тем грамматики не залит:', describeError(error));
  }
}

/** Все темы справочника (с текстом или без). */
export async function listTopics(env: Env, lang: string = GRAMMAR.lang): Promise<GrammarRow[]> {
  if (!env.DB) return [];
  await ensureSchema(env);
  await seedOnce(env);
  const result = await env.DB.prepare(
    'SELECT * FROM grammar_topics WHERE lang = ? ORDER BY category ASC, level ASC, title_de ASC LIMIT ?',
  )
    .bind(lang, GRAMMAR.maxTopics)
    .all<GrammarRow>();
  return result.results ?? [];
}

/** Одна тема по slug. */
export async function readTopic(env: Env, slug: string): Promise<GrammarRow | null> {
  if (!env.DB) return null;
  await ensureSchema(env);
  await seedOnce(env);
  return env.DB.prepare('SELECT * FROM grammar_topics WHERE slug = ?').bind(slug).first<GrammarRow>();
}

/** Записывает текст темы (после ИИ или правки в админке). */
export async function saveTopicBody(
  env: Env,
  slug: string,
  body: GrammarBody,
  source: 'ai' | 'admin',
  editedBy: string | null,
): Promise<void> {
  if (!env.DB) throw new Error('D1 недоступна');
  await ensureSchema(env);
  await env.DB.prepare(
    'UPDATE grammar_topics SET body_json = ?, source = ?, edited_by = ?, updated_at = ? WHERE slug = ?',
  )
    .bind(JSON.stringify(body), source, editedBy, Date.now(), slug)
    .run();
}

/** Добавляет тему или обновляет её поля целиком (админка). */
export async function upsertTopic(
  env: Env,
  row: {
    slug: string;
    level: string;
    category: string;
    titleRu: string;
    titleDe: string;
    titleEn: string;
    body: GrammarBody;
  },
): Promise<void> {
  if (!env.DB) throw new Error('D1 недоступна');
  await ensureSchema(env);
  await env.DB.prepare(
    `INSERT INTO grammar_topics (slug, lang, level, category, title_ru, title_de, title_en, body_json, source, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?)
     ON CONFLICT(slug) DO UPDATE SET
       level = excluded.level, category = excluded.category, title_ru = excluded.title_ru,
       title_de = excluded.title_de, title_en = excluded.title_en,
       body_json = excluded.body_json, source = 'admin', updated_at = excluded.updated_at`,
  )
    .bind(
      row.slug,
      GRAMMAR.lang,
      row.level,
      row.category,
      row.titleRu,
      row.titleDe,
      row.titleEn,
      JSON.stringify(row.body),
      Date.now(),
    )
    .run();
}

export async function deleteTopic(env: Env, slug: string): Promise<void> {
  if (!env.DB) throw new Error('D1 недоступна');
  await ensureSchema(env);
  await env.DB.prepare('DELETE FROM grammar_topics WHERE slug = ?').bind(slug).run();
}

/** Slug из запроса: только строка вида konjunktiv-2. */
export function requireSlug(raw: unknown): string {
  if (typeof raw !== 'string') throw new ApiError('VALIDATION', 400);
  const slug = raw.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) throw new ApiError('VALIDATION', 400);
  return slug;
}

/** Названия тем на языке интерфейса (для админки и ссылок «Смотрите также»). */
export function titleFor(
  slug: string,
  uiLang: 'ru' | 'de' | 'en',
  rows: GrammarRow[],
): string | null {
  const row = rows.find((item) => item.slug === slug);
  if (!row) return isGermanGrammarSlug(slug) ? slug : null;
  if (uiLang === 'de') return row.title_de || row.title_ru || row.title_en;
  if (uiLang === 'en') return row.title_en || row.title_ru || row.title_de;
  return row.title_ru || row.title_de || row.title_en;
}
