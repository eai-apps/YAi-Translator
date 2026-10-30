-- Начальная схема D1 для YAi Translator (этап 1).
-- Кэш ответов ИИ: одинаковые запросы не тратят лимит провайдеров.
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);

-- Счётчик дневных запросов с одного IP (IP хранится только как хеш).
CREATE TABLE IF NOT EXISTS usage (
  ip_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, day)
);

CREATE INDEX IF NOT EXISTS idx_usage_day ON usage (day);
