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

  // --- Этап 2: аккаунт, сессии, ключи пользователя и синхронизация избранного ---
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device TEXT,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)',
  `CREATE TABLE IF NOT EXISTS user_keys (
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    last4 TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, provider)
  )`,
  `CREATE TABLE IF NOT EXISTS user_items (
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, item_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_user_items_user_day ON user_items (user_id, updated_at)',
  `CREATE TABLE IF NOT EXISTS login_attempts (
    ip_hash TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    attempts INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, window_start)
  )`,
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
