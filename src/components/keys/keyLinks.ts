/** Прямые страницы создания бесплатного ключа и названия сервисов ИИ. */
import type { KeyProvider } from '../../../shared/types';

export const KEY_LINKS: Record<KeyProvider, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  groq: 'https://console.groq.com/keys',
};

/** Три коротких шага «за 3 нажатия» для каждого сервиса. */
export const KEY_STEPS: Record<KeyProvider, string[]> = {
  gemini: ['keys.geminiStep1', 'keys.geminiStep2', 'keys.geminiStep3'],
  groq: ['keys.groqStep1', 'keys.groqStep2', 'keys.groqStep3'],
};

export const KEY_PROVIDER_NAMES: Record<KeyProvider, string> = {
  gemini: 'Gemini',
  groq: 'Groq',
};

/** Открывает страницу получения ключа в новой вкладке. */
export function openKeyLink(provider: KeyProvider): void {
  window.open(KEY_LINKS[provider], '_blank', 'noopener,noreferrer');
}
