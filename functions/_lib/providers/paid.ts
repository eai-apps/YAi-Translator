/**
 * Провайдер «Платная нейросеть»: запрос к OpenAI-совместимому API по ключу пользователя.
 * Base URL задаётся пользователем; поддерживаются OpenRouter и другие совместимые сервисы.
 */
import type { AiProvider, GenerateInput } from './types';
import { PAID_AI } from '../config';

/** Проверяет Base URL на безопасность: только https://, без IP и localhost. */
export function validatePaidBaseUrl(url: string): boolean {
  if (!url.startsWith('https://')) return false;
  const clean = url.slice(8).split('/')[0].toLowerCase();
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(clean)) return false;
  if (/^\d+\.\d+\.\d+\.\d+/.test(clean)) return false;
  return true;
}

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { total_tokens?: number };
}

async function callPaidApi(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  signal: AbortSignal;
}): Promise<{ text: string; totalTokens: number }> {
  const { baseUrl, apiKey, model, systemPrompt, userPrompt, signal } = input;
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAID_AI.timeoutMs);
  const onOuter = () => controller.abort();
  signal.addEventListener('abort', onOuter, { once: true });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: PAID_AI.maxOutputTokens,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onOuter);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Paid AI ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as OpenAiChatResponse;
  const text = data?.choices?.[0]?.message?.content ?? '';
  const totalTokens = data?.usage?.total_tokens ?? 0;
  return { text, totalTokens };
}

export const paidProvider: AiProvider = {
  id: 'paid',
  tasks: ['translate', 'word', 'explain', 'check', 'grammar', 'ask'],

  async generate(input: GenerateInput & { baseUrl?: string; paidModel?: string }): Promise<string> {
    const baseUrl = input.baseUrl ?? '';
    const apiKey = input.apiKey ?? '';
    const model = input.paidModel ?? '';

    if (!baseUrl || !apiKey || !model) {
      throw new Error('Paid AI: не задан baseUrl, apiKey или model');
    }
    if (!validatePaidBaseUrl(baseUrl)) {
      throw new Error('Paid AI: недопустимый Base URL');
    }
    const { text, totalTokens } = await callPaidApi({
      baseUrl,
      apiKey,
      model,
      systemPrompt: input.prompt.system,
      userPrompt: input.prompt.user,
      signal: input.signal,
    });
    (input as { onUsage?: (tokens: number) => void }).onUsage?.(totalTokens);
    return text;
  },
};
