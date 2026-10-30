/** Проверка ИИ-сервисов сайта: Gemini, Groq и Cloudflare Workers AI. */
import type { ServiceCheck, UiLanguage } from '../../../shared/types';
import { GEMINI, GROQ, HEALTH_CHECK, WORKERS_AI } from '../config';
import type { Env } from '../env';
import { messages } from './messages';
import { withTimeoutSignal } from '../utils';

const PROBE_PROMPT = 'Reply with the single word: ok';

/**
 * Gemini: те же адрес и модель, что и в переводе, но крошечный ответ.
 * key — первый рабочий ключ из пула (переменная Cloudflare или ключ из админки).
 */
export async function checkGemini(env: Env, uiLang: UiLanguage, key: string | null): Promise<ServiceCheck> {
  if (!key) return messages.notConfigured(uiLang);
  const started = Date.now();
  const { signal, clear } = withTimeoutSignal(undefined, HEALTH_CHECK.timeoutMs);
  try {
    const response = await fetch(`${GEMINI.baseUrl}/${GEMINI.models[0]}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROBE_PROMPT }] }],
        generationConfig: { maxOutputTokens: 16, temperature: 0 },
      }),
    });
    const latencyMs = Date.now() - started;
    return response.ok
      ? { ok: true, latencyMs, message: null }
      : messages.status('Gemini', response.status, latencyMs, uiLang);
  } catch {
    return messages.unreachable('Gemini', Date.now() - started, uiLang);
  } finally {
    clear();
  }
}

/** Groq: тот же адрес и модель, что в переводе. */
export async function checkGroq(env: Env, uiLang: UiLanguage, key: string | null): Promise<ServiceCheck> {
  if (!key) return messages.notConfigured(uiLang);
  const started = Date.now();
  const { signal, clear } = withTimeoutSignal(undefined, HEALTH_CHECK.timeoutMs);
  try {
    const response = await fetch(GROQ.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal,
      body: JSON.stringify({
        model: GROQ.models[0],
        messages: [{ role: 'user', content: PROBE_PROMPT }],
        max_tokens: 4,
        temperature: 0,
      }),
    });
    const latencyMs = Date.now() - started;
    return response.ok
      ? { ok: true, latencyMs, message: null }
      : messages.status('Groq', response.status, latencyMs, uiLang);
  } catch {
    return messages.unreachable('Groq', Date.now() - started, uiLang);
  } finally {
    clear();
  }
}

/** Workers AI: настоящий маленький запрос через binding. */
export async function checkWorkersAi(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  if (!env.AI) return messages.notConfigured(uiLang);
  const started = Date.now();
  const { signal, clear } = withTimeoutSignal(undefined, HEALTH_CHECK.timeoutMs);
  try {
    const request = env.AI.run(WORKERS_AI.model, {
      messages: [{ role: 'user', content: PROBE_PROMPT }],
      max_tokens: 4,
    });
    const aborted = new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
    });
    const result = (await Promise.race([request, aborted])) as { response?: string } | string;
    const text = typeof result === 'string' ? result : (result?.response ?? '');
    const latencyMs = Date.now() - started;
    return text.trim()
      ? { ok: true, latencyMs, message: null }
      : messages.unreachable('Workers AI', latencyMs, uiLang);
  } catch {
    return messages.unreachable('Workers AI', Date.now() - started, uiLang);
  } finally {
    clear();
  }
}
