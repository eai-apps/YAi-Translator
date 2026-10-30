/** Переменные окружения Cloudflare Pages. Секреты задаются только в панели Cloudflare или в .dev.vars. */
export interface Env {
  /** D1: кэш ответов и счётчик дневных запросов. Может отсутствовать локально. */
  DB?: D1Database;
  /** Workers AI — последний запасной провайдер. */
  AI?: WorkersAiBinding;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  DEEPL_API_KEY?: string;
}

/** Минимальный тип binding'а Workers AI, чтобы не зависеть от версии workers-types. */
export interface WorkersAiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}
