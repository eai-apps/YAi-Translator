-- Этап 3 (версия 0.4.0): резервные ключи сайта, статистика, посетители, админка, настройки.
-- Схема совпадает с functions/_lib/schema.ts: таблицы создаются и автоматически.

-- Блокировка аккаунта: заблокированный не может войти, а живые сессии отклоняются.
-- В новых базах колонка уже есть в CREATE TABLE users; здесь — для базы этапа 2.
ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0;

-- Ключи сайта, добавленные в админке. Шифруются AES-GCM (encryptKey, контекст site:<provider>:<id>).
-- Клиенту и журналам показывается только last4 ("••••1234").
CREATE TABLE IF NOT EXISTS site_keys (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  last4 TEXT NOT NULL,
  region TEXT,
  created_at INTEGER NOT NULL,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_site_keys_provider ON site_keys (provider);

-- Состояние каждого ключа (из Cloudflare и из админки). Сам ключ здесь не хранится:
-- key_id — первые 12 символов SHA-256 ключа.
-- exhausted_until — ключ «отдыхает» до 00:00 UTC (ответ 429 / квота исчерпана).
-- invalid = 1 — ключ неверный (401/403), больше не используется.
CREATE TABLE IF NOT EXISTS key_state (
  provider TEXT NOT NULL,
  key_id TEXT NOT NULL,
  exhausted_until INTEGER,
  invalid INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_used_at INTEGER,
  PRIMARY KEY (provider, key_id)
);

-- Дневные счётчики для админки. metric: translations:<сервис>, word, explain, check, compare,
-- cache_hits, ai_requests, visitors, pair:<от>-<до>.
CREATE TABLE IF NOT EXISTS stats_daily (
  day TEXT NOT NULL,
  metric TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);

-- Уникальные посетители за день: хеш «IP + день». IP не хранится.
CREATE TABLE IF NOT EXISTS visitors (
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (day, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_visitors_day ON visitors (day);

-- Журнал действий админов: кто, что и когда сделал.
CREATE TABLE IF NOT EXISTS admin_log (
  id TEXT PRIMARY KEY,
  at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  login TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_log_at ON admin_log (at);

-- Настройки сайта: daily_limit и banner (JSON).
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
