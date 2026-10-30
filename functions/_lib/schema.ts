/**
 * Автоматическое создание таблиц D1. Выполняется один раз на запуск сервера,
 * поэтому миграцию вручную запускать не нужно. Схема совпадает с migrations/*.sql.
 */
import type { Env } from './env';

/** Сообщения о том, что объект уже существует, — это не ошибка. */
const ALREADY_EXISTS = /duplicate column name|already exists/i;

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
    last_login_at INTEGER,
    blocked INTEGER NOT NULL DEFAULT 0
  )`,
  // Добавлено на этапе 3: у базы этапа 2 нет колонки blocked.
  'ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0',
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

  // --- Этап 3: резервные ключи, статистика, посетители, админка, настройки ---
  // Ключи сайта, добавленные в админке (шифруются AES-GCM, в строке только шифротекст).
  `CREATE TABLE IF NOT EXISTS site_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    last4 TEXT NOT NULL,
    region TEXT,
    created_at INTEGER NOT NULL,
    created_by TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_site_keys_provider ON site_keys (provider)',
  // Состояние каждого ключа (и своего, и из Cloudflare): отдыхает до … / неверный.
  `CREATE TABLE IF NOT EXISTS key_state (
    provider TEXT NOT NULL,
    key_id TEXT NOT NULL,
    exhausted_until INTEGER,
    invalid INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    last_used_at INTEGER,
    PRIMARY KEY (provider, key_id)
  )`,
  // Дневные счётчики: metric = translations:deepl, visitors, cache_hits …
  `CREATE TABLE IF NOT EXISTS stats_daily (
    day TEXT NOT NULL,
    metric TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, metric)
  )`,
  // Посетители: хеш «IP + день», сам IP не хранится.
  `CREATE TABLE IF NOT EXISTS visitors (
    day TEXT NOT NULL,
    visitor_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (day, visitor_hash)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_visitors_day ON visitors (day)',
  // Журнал действий админов.
  `CREATE TABLE IF NOT EXISTS admin_log (
    id TEXT PRIMARY KEY,
    at INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    login TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_log_at ON admin_log (at)',
  // Настройки сайта: ключ → JSON-значение.
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // --- Этап 4: полезные ресурсы по языкам (начальный набор — migrations/0004_resources.sql) ---
  `CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lang TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description_ru TEXT NOT NULL DEFAULT '',
    description_de TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0
  )`,
  'CREATE INDEX IF NOT EXISTS idx_resources_lang ON resources (lang, category, sort)',
];

let ready: Promise<void> | null = null;

/**
 * Выполняет batch по одному: в batch D1 одна ошибка портит весь набор,
 * а ALTER TABLE с уже существующей колонкой / CREATE INDEX на базу этапа 3 ошибаются предсказуемо — пропускаем их.
 */
async function runStatements(db: D1Database): Promise<void> {
  for (const sql of STATEMENTS) {
    try {
      await db.prepare(sql).run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (ALREADY_EXISTS.test(message)) continue;
      throw error;
    }
  }
}

export function ensureSchema(env: Env): Promise<void> {
  if (!env.DB) return Promise.resolve();
  const db = env.DB;
  ready ??= runStatements(db).catch((error: unknown) => {
    ready = null; // попробуем снова при следующем запросе
    throw error;
  });
  return ready;
}
