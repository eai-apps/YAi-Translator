-- Миграция этапа 8В/7: платные нейросети, ссылки на покупку ключей.

CREATE TABLE IF NOT EXISTS paid_connections (
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
);

CREATE TABLE IF NOT EXISTS buy_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  howto_ru TEXT NOT NULL DEFAULT '',
  howto_de TEXT NOT NULL DEFAULT '',
  howto_en TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_buy_links_sort ON buy_links (sort, hidden);

-- Начальные ссылки «Где купить ключ».
INSERT OR IGNORE INTO buy_links (title, url, howto_ru, howto_de, howto_en, sort, hidden) VALUES
(
  '✅ Проверенный продавец ключа от 1$',
  'https://digiseller.me/asp2/pay.asp?id_d=5079491&ai=1481171',
  'После оплаты внимательно прочитайте чек, который пришлёт Digiseller на почту, — особенно раздел «Дополнительная информация». Там ключ, адрес сайта для активации и Base URL. Продавец обязан всё это указать. Дальше: Профиль → «Ключи ИИ» → «Платная нейросеть» → вставьте Base URL, потом ключ → «Загрузить модели». Чего-то не хватает в чеке — напишите продавцу в чат на Plati.',
  'Nach der Zahlung lesen Sie bitte die Quittung, die Digiseller per E-Mail sendet — besonders den Abschnitt «Zusätzliche Informationen». Dort finden Sie den Schlüssel, die Aktivierungs-URL und die Base URL.',
  'After payment, carefully read the receipt that Digiseller sends to your email — especially the section "Additional Information". It contains the key, activation website, and Base URL.',
  1, 0
),
(
  '🛒 Gemini, Claude, ChatGPT — API от 1M до 1B токенов',
  'https://plati.market/itm/api-gemini-flash-3-7-3-6-3-5-pro-3-1-auto-delivery-1m-1b/6056762',
  'Проверено владельцем: работают Gemini, Claude и ChatGPT. Ключ приходит сразу после оплаты. После покупки вы получите ключ вида XXXXXXXXXXXXXXX: 1. Откройте сайт продавца https://ai.starimg.ru 2. Введите полученный ключ. 3. Следуйте инструкциям — он покажет API-ключ (начинается с sk-) и Base URL: https://ai.starimg.ru/v1 4. Профиль → «Ключи ИИ» → «Платная нейросеть» → вставьте адрес, потом ключ. 5. «Загрузить модели» → выберите модель.',
  'Vom Eigentümer bestätigt: Gemini, Claude und ChatGPT funktionieren. Der Schlüssel kommt sofort nach der Zahlung.',
  'Verified by the owner: Gemini, Claude and ChatGPT work. The key arrives immediately after payment.',
  2, 0
),
(
  '🗂 Все предложения ключей Gemini',
  'https://plati.market/games/gemini/1541/',
  'Разные продавцы и цены. Покупайте именно API (токены), не подписку и не аккаунт.',
  'Verschiedene Anbieter und Preise. Kaufen Sie nur API (Token), keine Abonnements oder Konten.',
  'Various sellers and prices. Buy API tokens only, not subscriptions or accounts.',
  3, 0
),
(
  '🌐 OpenRouter — один ключ на сотни нейросетей',
  'https://openrouter.ai',
  'Оплата картой. Войдите → Credits → пополните → Keys → «Create Key» → скопируйте ключ (sk-or-…). Base URL: https://openrouter.ai/api/v1.',
  'Zahlung per Karte. Einloggen → Credits → aufladen → Keys → «Create Key» → Schlüssel kopieren (sk-or-…). Base URL: https://openrouter.ai/api/v1.',
  'Pay by card. Sign in → Credits → top up → Keys → «Create Key» → copy the key (sk-or-…). Base URL: https://openrouter.ai/api/v1.',
  4, 0
);
