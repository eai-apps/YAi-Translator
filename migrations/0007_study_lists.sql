-- Этап 8Б: свои списки слов «Мои списки».
-- Список хранит название, значок и id карточек из study_cards в payload (JSON).
-- Таблица создаётся и автоматически: functions/_lib/schema.ts (эта же строка).
CREATE TABLE IF NOT EXISTS study_lists (
  user_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, list_id)
);

CREATE INDEX IF NOT EXISTS idx_study_lists_user ON study_lists (user_id, updated_at);
