/**
 * Переменные окружения Cloudflare Pages. Секреты задаются только в панели Cloudflare или в .dev.vars.
 * Резервные ключи (GEMINI_API_KEY_2 … _5 и такие же для других сервисов) читаются
 * через Numbers по имени, поэтому здесь они не перечислены.
 */
export interface Env {
  /** Статические словари текущей сборки Pages. */
  ASSETS?: { fetch(request: Request): Promise<Response> };
  /** D1: кэш ответов и счётчик дневных запросов. Может отсутствовать локально. */
  DB?: D1Database;
  /** Workers AI — последний запасной провайдер. */
  AI?: WorkersAiBinding;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  DEEPL_API_KEY?: string;
  /** Microsoft Translator (Azure F0): ключ и регион ресурса, например westeurope. */
  MICROSOFT_TRANSLATOR_KEY?: string;
  MICROSOFT_TRANSLATOR_REGION?: string;
  /** Google Cloud Translation API (Basic v2). */
  GOOGLE_TRANSLATE_KEY?: string;
  /** Lara Translate: идентификатор и секрет ключа. */
  LARA_ACCESS_KEY_ID?: string;
  LARA_ACCESS_KEY_SECRET?: string;
  /** Почта для MyMemory: поднимает бесплатный лимит с 5 000 до 50 000 символов в день. */
  MYMEMORY_EMAIL?: string;
  /**
   * Секрет для шифрования ключей ИИ пользователей (AES-GCM), 32 случайных байта в base64.
   * Если не задан, ключи в аккаунте не сохраняются — только на устройстве.
   */
  KEY_ENCRYPTION_SECRET?: string;
  /** Логины админов через запятую. Без этого секрета админки нет ни у кого. */
  ADMIN_LOGINS?: string;
  /** PONS API (этап 4): необязательный, 1000 запросов в месяц бесплатно. */
  PONS_API_KEY?: string;
  /** Секрет для вызова прогрева карточек /api/admin/warm (этап 11). */
  WARM_TOKEN?: string;
}

/** Минимальный тип binding'а Workers AI, чтобы не зависеть от версии workers-types. */
export interface WorkersAiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}
