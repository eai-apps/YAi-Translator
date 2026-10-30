/**
 * Дневная статистика для админки (версия 0.4.0) — таблица stats_daily(day, metric, value).
 * Каждый счётчик увеличивается одной записью INSERT … ON CONFLICT DO UPDATE value = value + 1.
 * Уникальные посетители считаются по хешу «IP + день» (таблица visitors), сам IP не хранится.
 */
import { ADMIN } from './config';
import type { Env } from './env';
import { ensureSchema } from './schema';
import { describeError } from './utils';

/** Название дня по UTC: 2026-10-30. */
export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** День со сдвигом назад: daysAgo(1) — вчера. */
export function dayKeyBefore(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return dayKey(date);
}

/** Увеличивает счётчики на 1. Ошибка статистики никогда не ломает сам запрос. */
export async function bump(env: Env, metrics: string[]): Promise<void> {
  if (!env.DB || metrics.length === 0) return;
  const day = dayKey();
  try {
    await ensureSchema(env);
    await env.DB.batch(
      metrics.map((metric) =>
        env.DB!.prepare(
          `INSERT INTO stats_daily (day, metric, value) VALUES (?, ?, 1)
           ON CONFLICT(day, metric) DO UPDATE SET value = value + 1`,
        ).bind(day, metric),
      ),
    );
  } catch (error) {
    console.warn('Статистика не записана:', describeError(error));
  }
}

/** Прибавляет число к счётчику (например, для популярных языковых пар). */
export async function addTo(env: Env, metric: string, amount: number): Promise<void> {
  if (!env.DB || amount <= 0) return;
  try {
    await ensureSchema(env);
    await env.DB.prepare(
      `INSERT INTO stats_daily (day, metric, value) VALUES (?, ?, ?)
       ON CONFLICT(day, metric) DO UPDATE SET value = value + excluded.value`,
    )
      .bind(dayKey(), metric, Math.round(amount))
      .run();
  } catch (error) {
    console.warn('Статистика не записана:', describeError(error));
  }
}

/** Значения счётчиков за указанные дни: metric → сумма по дням. */
export async function sumSince(env: Env, sinceDay: string, prefix?: string): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};
  if (!env.DB) return totals;
  try {
    await ensureSchema(env);
    const result = await env.DB.prepare(
      'SELECT metric, SUM(value) AS total FROM stats_daily WHERE day >= ? GROUP BY metric',
    )
      .bind(sinceDay)
      .all<{ metric: string; total: number }>();
    for (const row of result.results ?? []) {
      if (prefix && !row.metric.startsWith(prefix)) continue;
      totals[row.metric] = row.total ?? 0;
    }
  } catch (error) {
    console.warn('Статистика недоступна:', describeError(error));
  }
  return totals;
}

/** Значение одного счётчика за день. */
export async function valueOf(env: Env, day: string, metric: string): Promise<number> {
  if (!env.DB) return 0;
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT value FROM stats_daily WHERE day = ? AND metric = ?')
      .bind(day, metric)
      .first<{ value: number }>();
    return row?.value ?? 0;
  } catch {
    return 0;
  }
}

/** Уникальные посетители за дни от sinceDay включительно. */
export async function countVisitors(env: Env, sinceDay: string): Promise<number> {
  if (!env.DB) return 0;
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT COUNT(DISTINCT visitor_hash) AS total FROM visitors WHERE day >= ?')
      .bind(sinceDay)
      .first<{ total: number }>();
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Отмечает заход посетителя: хеш «IP + день» в таблице visitors и строку в stats_daily.
 * Одна и та же комбинация хеша и даты не считается дважды; случайная доля просроченных отметок чистится.
 */
export async function registerVisitor(env: Env, visitorHash: string): Promise<void> {
  if (!env.DB) return;
  const day = dayKey();
  try {
    await ensureSchema(env);
    const existing = await env.DB.prepare('SELECT 1 AS found FROM visitors WHERE day = ? AND visitor_hash = ?')
      .bind(day, visitorHash)
      .first<{ found: number }>();
    if (existing) return;

    await env.DB.prepare(
      'INSERT OR IGNORE INTO visitors (day, visitor_hash, created_at) VALUES (?, ?, ?)',
    )
      .bind(day, visitorHash, Date.now())
      .run();
    // Отметка в stats_daily: для старых дней таблица visitors чистится.
    await bump(env, ['visits_event']);

    // Старые отметки (счётчики посетителей считаются по visits_event) чистим изредка.
    if (Math.random() < 0.02) {
      await env.DB.prepare('DELETE FROM visitors WHERE day < ?')
        .bind(dayKeyBefore(ADMIN.visitorRetentionDays))
        .run();
    }
  } catch (error) {
    console.warn('Посетитель не отмечен:', describeError(error));
  }
}

/** Уникальные посетители за день: число строк в visitors. */
export async function visitorsOnDay(env: Env, day: string): Promise<number> {
  if (!env.DB) return 0;
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT COUNT(*) AS total FROM visitors WHERE day = ?')
      .bind(day)
      .first<{ total: number }>();
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}
