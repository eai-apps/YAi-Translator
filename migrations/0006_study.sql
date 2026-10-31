-- Этап 6 (версия 0.7.0): карточки слов, прогресс повторения и дни учёбы.
-- Таблицы создаются и автоматически (functions/_lib/schema.ts); миграция нужна для удалённой базы.
-- Запуск: npx wrangler d1 execute yai-translator-db --remote --file=./migrations/0006_study.sql
--
-- Схема совпадает с schema.ts. Повторный запуск безопасен: IF NOT EXISTS.
-- Карточка хранит снимок слова в payload — упражнения не обращаются к ИИ.

CREATE TABLE IF NOT EXISTS study_cards (
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_study_cards_user ON study_cards (user_id, updated_at);

CREATE TABLE IF NOT EXISTS study_progress (
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  ease REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  due INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  introduced_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_study_progress_user ON study_progress (user_id, updated_at);

CREATE TABLE IF NOT EXISTS study_days (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  reviews INTEGER NOT NULL DEFAULT 0,
  exercises INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_study_days_user ON study_days (user_id, day);
