/**
 * Проверка ключа Gemini или Groq настоящим маленьким запросом.
 * Используется и в /api/key-test, и при сохранении ключа в аккаунт.
 */
import type { KeyProvider, ServiceCheck, UiLanguage } from '../../shared/types';
import { GEMINI, GROQ } from './config';
import { KEY_TEST_PROMPT } from './prompts';
import { withTimeoutSignal } from './utils';

const TIMEOUT_MS = 10_000;

// Пояснения для неудачной проверки — на языке интерфейса запроса.
const TEST_MESSAGES: Record<
  UiLanguage,
  {
    status: (service: string, status: number) => string;
    unreachable: (service: string) => string;
  }
> = {
  ru: {
    status: (service, status) => `${service} ответил кодом ${status}.`,
    unreachable: (service) => `Не удалось связаться с ${service}.`,
  },
  de: {
    status: (service, status) => `${service} antwortete mit Status ${status}.`,
    unreachable: (service) => `${service} ist nicht erreichbar.`,
  },
  en: {
    status: (service, status) => `${service} responded with status ${status}.`,
    unreachable: (service) => `${service} could not be reached.`,
  },
};

/** Понятная причина по HTTP-коду ответа сервиса. */
function describeStatus(
  provider: KeyProvider,
  status: number,
  uiLang: UiLanguage,
): string | null {
  if (status === 200) return null;
  const service = provider === 'gemini' ? 'Gemini' : 'Groq';
  return TEST_MESSAGES[uiLang].status(service, status);
}

async function testGemini(key: string): Promise<{ ok: boolean; status: number | null }> {
  const { signal, clear } = withTimeoutSignal(undefined, TIMEOUT_MS);
  try {
    const response = await fetch(`${GEMINI.baseUrl}/${GEMINI.models[0]}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: KEY_TEST_PROMPT }] }],
        generationConfig: { maxOutputTokens: 64, temperature: 0 },
      }),
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clear();
  }
}

async function testGroq(key: string): Promise<{ ok: boolean; status: number | null }> {
  const { signal, clear } = withTimeoutSignal(undefined, TIMEOUT_MS);
  try {
    const response = await fetch(GROQ.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal,
      body: JSON.stringify({
        model: GROQ.models[0],
        messages: [{ role: 'user', content: KEY_TEST_PROMPT }],
        max_tokens: 8,
        temperature: 0,
      }),
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clear();
  }
}

/** Проверяет ключ. Сообщение об ошибке — null при успехе. */
export async function checkProviderKey(
  provider: KeyProvider,
  key: string,
  uiLang: UiLanguage,
): Promise<ServiceCheck> {
  const started = Date.now();
  const result = provider === 'gemini' ? await testGemini(key) : await testGroq(key);
  const latencyMs = Date.now() - started;

  if (result.status === null) {
    const service = provider === 'gemini' ? 'Gemini' : 'Groq';
    return { ok: false, latencyMs, message: TEST_MESSAGES[uiLang].unreachable(service) };
  }
  return { ok: result.ok, latencyMs, message: describeStatus(provider, result.status, uiLang) };
}
