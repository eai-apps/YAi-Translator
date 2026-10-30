/**
 * POST /api/key-test — проверка ключа пользователя перед сохранением.
 * Ключ передаётся только в этом запросе и нигде не сохраняется на сервере.
 */
import type { KeyTestResponse, UiLanguage } from '../../shared/types';
import { GEMINI, GROQ } from '../_lib/config';
import { KEY_TEST_PROMPT } from '../_lib/prompts';
import type { Env } from '../_lib/env';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { withTimeoutSignal } from '../_lib/utils';

interface TestResult {
  ok: boolean;
  message: string | null;
}

// Пояснение для неудачной проверки — на языке интерфейса запроса.
const TEST_MESSAGES: Record<
  UiLanguage,
  { status: (service: string, status: number) => string; unreachable: (service: string) => string }
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

async function testGemini(key: string, uiLang: UiLanguage): Promise<TestResult> {
  const { signal, clear } = withTimeoutSignal(undefined, 10_000);
  try {
    const response = await fetch(
      `${GEMINI.baseUrl}/${GEMINI.models[0]}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: KEY_TEST_PROMPT }] }],
          generationConfig: { maxOutputTokens: 64, temperature: 0 },
        }),
      },
    );
    if (response.ok) return { ok: true, message: null };
    return { ok: false, message: TEST_MESSAGES[uiLang].status('Gemini', response.status) };
  } catch {
    return { ok: false, message: TEST_MESSAGES[uiLang].unreachable('Gemini') };
  } finally {
    clear();
  }
}

async function testGroq(key: string, uiLang: UiLanguage): Promise<TestResult> {
  const { signal, clear } = withTimeoutSignal(undefined, 10_000);
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
    if (response.ok) return { ok: true, message: null };
    return { ok: false, message: TEST_MESSAGES[uiLang].status('Groq', response.status) };
  } catch {
    return { ok: false, message: TEST_MESSAGES[uiLang].unreachable('Groq') };
  } finally {
    clear();
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const provider = body.provider;
    const key = typeof body.key === 'string' ? body.key.trim() : '';

    if ((provider !== 'gemini' && provider !== 'groq') || !key || key.length > 300) {
      throw new ApiError('VALIDATION', 400);
    }

    const started = Date.now();
    const result = provider === 'gemini' ? await testGemini(key, uiLang) : await testGroq(key, uiLang);
    const body_: KeyTestResponse = {
      ok: result.ok,
      latencyMs: Date.now() - started,
      message: result.message,
    };
    return jsonResponse(body_);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
