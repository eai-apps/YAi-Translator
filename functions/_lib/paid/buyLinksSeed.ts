/**
 * Начальные ссылки «Где купить ключ» (этап 7, тексты владельца из migrations/0008_paid_ai.sql).
 * Миграции на сайте сами не запускаются, поэтому набор записывается один раз при первом чтении
 * (флаг buy_links_seeded в настройках: если админ потом всё удалит, ссылки не вернутся).
 */
import type { Env } from '../env';
import { readSetting, writeSetting } from '../settings';
import { describeError } from '../utils';

const SEED = [
  {
    "title": "✅ Проверенный продавец ключа от 1$",
    "url": "https://digiseller.me/asp2/pay.asp?id_d=5079491&ai=1481171",
    "howtoRu": "После оплаты внимательно прочитайте чек, который пришлёт Digiseller на почту, — особенно раздел «Дополнительная информация». Там ключ, адрес сайта для активации и Base URL. Продавец обязан всё это указать. Дальше: Профиль → «Ключи ИИ» → «Платная нейросеть» → вставьте Base URL, потом ключ → «Загрузить модели». Чего-то не хватает в чеке — напишите продавцу в чат на Plati.",
    "howtoDe": "Nach der Zahlung lesen Sie bitte die Quittung, die Digiseller per E-Mail sendet — besonders den Abschnitt «Zusätzliche Informationen». Dort finden Sie den Schlüssel, die Aktivierungs-URL und die Base URL.",
    "howtoEn": "After payment, carefully read the receipt that Digiseller sends to your email — especially the section \"Additional Information\". It contains the key, activation website, and Base URL.",
    "sort": 1
  },
  {
    "title": "🛒 Gemini, Claude, ChatGPT — API от 1M до 1B токенов",
    "url": "https://plati.market/itm/api-gemini-flash-3-7-3-6-3-5-pro-3-1-auto-delivery-1m-1b/6056762",
    "howtoRu": "Проверено владельцем: работают Gemini, Claude и ChatGPT. Ключ приходит сразу после оплаты. После покупки вы получите ключ вида XXXXXXXXXXXXXXX: 1. Откройте сайт продавца https://ai.starimg.ru 2. Введите полученный ключ. 3. Следуйте инструкциям — он покажет API-ключ (начинается с sk-) и Base URL: https://ai.starimg.ru/v1 4. Профиль → «Ключи ИИ» → «Платная нейросеть» → вставьте адрес, потом ключ. 5. «Загрузить модели» → выберите модель.",
    "howtoDe": "Vom Eigentümer bestätigt: Gemini, Claude und ChatGPT funktionieren. Der Schlüssel kommt sofort nach der Zahlung.",
    "howtoEn": "Verified by the owner: Gemini, Claude and ChatGPT work. The key arrives immediately after payment.",
    "sort": 2
  },
  {
    "title": "🗂 Все предложения ключей Gemini",
    "url": "https://plati.market/games/gemini/1541/",
    "howtoRu": "Разные продавцы и цены. Покупайте именно API (токены), не подписку и не аккаунт.",
    "howtoDe": "Verschiedene Anbieter und Preise. Kaufen Sie nur API (Token), keine Abonnements oder Konten.",
    "howtoEn": "Various sellers and prices. Buy API tokens only, not subscriptions or accounts.",
    "sort": 3
  },
  {
    "title": "🌐 OpenRouter — один ключ на сотни нейросетей",
    "url": "https://openrouter.ai",
    "howtoRu": "Оплата картой. Войдите → Credits → пополните → Keys → «Create Key» → скопируйте ключ (sk-or-…). Base URL: https://openrouter.ai/api/v1.",
    "howtoDe": "Zahlung per Karte. Einloggen → Credits → aufladen → Keys → «Create Key» → Schlüssel kopieren (sk-or-…). Base URL: https://openrouter.ai/api/v1.",
    "howtoEn": "Pay by card. Sign in → Credits → top up → Keys → «Create Key» → copy the key (sk-or-…). Base URL: https://openrouter.ai/api/v1.",
    "sort": 4
  }
] as const;

export async function seedBuyLinksOnce(env: Env): Promise<void> {
  if (!env.DB) return;
  try {
    if (await readSetting<boolean>(env, 'buy_links_seeded')) return;
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM buy_links').first<{ n: number }>();
    if ((count?.n ?? 0) === 0) {
      await env.DB.batch(
        SEED.map((row) =>
          env.DB!.prepare(
            'INSERT INTO buy_links (title, url, howto_ru, howto_de, howto_en, sort, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
          ).bind(row.title, row.url, row.howtoRu, row.howtoDe, row.howtoEn, row.sort),
        ),
      );
    }
    await writeSetting(env, 'buy_links_seeded', true);
  } catch (error) {
    console.warn('Не удалось записать начальные ссылки покупки:', describeError(error));
  }
}
