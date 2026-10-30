/**
 * Автоматическое создание таблиц D1. Выполняется один раз на запуск сервера,
 * поэтому миграцию вручную запускать не нужно. Схема совпадает с migrations/*.sql.
 */
import type { Env } from './env';

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at)',
  `CREATE TABLE IF NOT EXISTS usage (
    ip_hash TEXT NOT NULL,
    day TEXT NOT NULL,
    requests INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, day)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_usage_day ON usage (day)',
];

let ready: Promise<void> | null = null;

export function ensureSchema(env: Env): Promise<void> {
  if (!env.DB) return Promise.resolve();
  const db = env.DB;
  ready ??= db
    .batch(STATEMENTS.map((sql) => db.prepare(sql)))
    .then(() => undefined)
    .catch((error: unknown) => {
      ready = null; // попробуем снова при следующем запросе
      throw error;
    });
  return ready;
}
