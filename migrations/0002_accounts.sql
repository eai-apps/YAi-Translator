-- Этап 2 (версия 0.3.0): аккаунт по логину и паролю, сессии, ключи ИИ в аккаунте,
-- синхронизация избранного и истории, защита от подбора пароля.
-- Схема совпадает с functions/_lib/schema.ts: таблицы создаются и автоматически.

-- Пользователи. Логин хранится в нижнем регистре; пароль — только хеш PBKDF2-SHA256 с солью.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Сессии. В базе лежит только SHA-256 от токена, сам токен — у пользователя.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device TEXT,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- Ключи ИИ пользователя: шифруются AES-GCM секретом KEY_ENCRYPTION_SECRET.
-- Клиенту никогда не отдаётся ключ целиком — только последние 4 символа.
CREATE TABLE IF NOT EXISTS user_keys (
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  last4 TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, provider)
);

-- Избранное и история: payload — JSON записи, deleted = 1 — запись удалена.
-- Побеждает запись с большим updated_at.
CREATE TABLE IF NOT EXISTS user_items (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_items_user_day ON user_items (user_id, updated_at);

-- Попытки входа и регистрации с одного IP (IP хранится только как хеш).
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, window_start)
);
