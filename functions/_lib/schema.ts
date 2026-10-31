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

  // --- Этап 5: справочник грамматики (начальный список тем — migrations/0005_grammar.sql) ---
  // body_json — текст правила на языке интерфейса; заполняется один раз (ИИ или админкой).
  `CREATE TABLE IF NOT EXISTS grammar_topics (
    slug TEXT PRIMARY KEY,
    lang TEXT NOT NULL DEFAULT 'de',
    level TEXT NOT NULL DEFAULT 'A1',
    category TEXT NOT NULL DEFAULT 'syntax',
    title_ru TEXT NOT NULL DEFAULT '',
    title_de TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    body_json TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'none',
    source_url TEXT,
    updated_at INTEGER,
    edited_by TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_grammar_topics_lang ON grammar_topics (lang, category, level)',

  // --- Этап 6: карточки слов, прогресс повторения и дни учёбы ---
  // Карточка — снимок слова (payload), чтобы упражнения не обращались к ИИ.
  `CREATE TABLE IF NOT EXISTS study_cards (
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, card_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_study_cards_user ON study_cards (user_id, updated_at)',
  // Прогресс по упрощённому SM-2: ease, interval, due, reps, lapses.
  `CREATE TABLE IF NOT EXISTS study_progress (
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
  )`,
  'CREATE INDEX IF NOT EXISTS idx_study_progress_user ON study_progress (user_id, updated_at)',
  // Итоги дня: серия дней и столбики за неделю.
  `CREATE TABLE IF NOT EXISTS study_days (
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,
    reviews INTEGER NOT NULL DEFAULT 0,
    exercises INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, day)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_study_days_user ON study_days (user_id, day)',
  // --- Этап 8Б: свои списки слов «Мои списки» ---
  // Список — название, значок и id карточек в payload; слово может быть в нескольких списках.
  `CREATE TABLE IF NOT EXISTS study_lists (
    user_id TEXT NOT NULL,
    list_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, list_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_study_lists_user ON study_lists (user_id, updated_at)',

  // --- Этап 7: платные нейросети (версия 0.9.1) ---
  // Подключения к платным OpenAI-совместимым API (ключ шифруется).
  `CREATE TABLE IF NOT EXISTS paid_connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    last4 TEXT NOT NULL,
    default_model TEXT NOT NULL DEFAULT '',
    enabled_models TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  // Ссылки «Где купить ключ» — редактируются в админке.
  `CREATE TABLE IF NOT EXISTS buy_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    howto_ru TEXT NOT NULL DEFAULT '',
    howto_de TEXT NOT NULL DEFAULT '',
    howto_en TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0
  )`,
  'CREATE INDEX IF NOT EXISTS idx_buy_links_sort ON buy_links (sort, hidden)',
];

/**
 * Только флаг «готово», а не общий Promise: в Cloudflare Workers обещание, начатое одним запросом,
 * зависает навсегда, если тот запрос отменили (человек продолжил печатать). Все следующие запросы
 * этого экземпляра ждали бы его вечно — так и «висел» перевод. Повторный прогон безопасен: IF NOT EXISTS.
 */
let schemaReady = false;

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

export async function ensureSchema(env: Env): Promise<void> {
  if (!env.DB || schemaReady) return;
  await runStatements(env.DB);
  schemaReady = true;
}
