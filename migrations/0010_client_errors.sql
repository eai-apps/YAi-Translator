-- Таблица журнала клиентских ошибок и обращений о проблемах (Часть 19, 0.21.0)
CREATE TABLE IF NOT EXISTS client_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  source TEXT,
  lineno INTEGER,
  colno INTEGER,
  app_version TEXT,
  user_agent TEXT,
  user_note TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_errors_timestamp ON client_errors (timestamp DESC);
