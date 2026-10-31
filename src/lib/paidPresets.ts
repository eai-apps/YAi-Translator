/**
 * Готовые сервисы для «Платной нейросети» (OpenAI-совместимый API). Выбор сервиса подставляет Base URL,
 * а по началу ключа сервис определяется сам (sk-or- → OpenRouter, gsk_ → Groq, AIza → Gemini…).
 */
export interface PaidPreset {
  id: string;
  name: string;
  url: string;
  /** Как начинается ключ этого сервиса — для автоопределения. */
  keyPrefix?: string;
}

export const PAID_PRESETS: PaidPreset[] = [
  { id: 'openrouter', name: 'OpenRouter — сотни нейросетей по одному ключу', url: 'https://openrouter.ai/api/v1', keyPrefix: 'sk-or-' },
  { id: 'starimg', name: 'Ключ с Plati (ai.starimg.ru)', url: 'https://ai.starimg.ru/v1' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', url: 'https://api.openai.com/v1', keyPrefix: 'sk-proj-' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai', keyPrefix: 'AIza' },
  { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1', keyPrefix: 'gsk_' },
  { id: 'xai', name: 'xAI (Grok)', url: 'https://api.x.ai/v1', keyPrefix: 'xai-' },
  { id: 'mistral', name: 'Mistral', url: 'https://api.mistral.ai/v1' },
  { id: 'together', name: 'Together AI', url: 'https://api.together.xyz/v1' },
];

export const CUSTOM_PRESET_ID = 'custom';

/** Какой сервис соответствует адресу (или «свой адрес»). */
export function presetForUrl(url: string): string {
  const clean = url.trim().replace(/\/$/, '');
  return PAID_PRESETS.find((preset) => preset.url === clean)?.id ?? CUSTOM_PRESET_ID;
}

/** Сервис по началу ключа; null — не узнали (у многих продавцов ключ просто «sk-…»). */
export function presetForKey(key: string): PaidPreset | null {
  const clean = key.trim();
  return PAID_PRESETS.find((preset) => preset.keyPrefix && clean.startsWith(preset.keyPrefix)) ?? null;
}
