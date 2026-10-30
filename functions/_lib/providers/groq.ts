/** Groq — быстрый бесплатный доступ к открытым моделям (OpenAI-совместимый API). */
import type { AiProvider, GenerateInput } from './types';
import { GROQ } from '../config';
import { withTimeoutSignal } from '../utils';

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

async function callModel(
  model: string,
  input: GenerateInput,
  apiKey: string,
  useJsonMode: boolean,
): Promise<string> {
  const { signal, clear } = withTimeoutSignal(input.signal, GROQ.timeoutMs);
  try {
    const response = await fetch(GROQ.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: GROQ.maxOutputTokens,
        messages: [
          { role: 'system', content: input.prompt.system },
          { role: 'user', content: input.prompt.user },
        ],
        ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as GroqResponse;
    if (!response.ok) {
      const message = data.error?.message ?? 'request failed';
      throw new Error(`Groq ${response.status}: ${message}`);
    }

    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) throw new Error('Groq returned an empty answer');
    return text;
  } finally {
    clear();
  }
}

export const groqProvider: AiProvider = {
  id: 'groq',
  tasks: ['translate', 'word', 'explain', 'check'],

  async generate(input) {
    if (!input.apiKey) throw new Error('Groq API key is missing');
    let lastError: unknown = null;

    for (const model of GROQ.models) {
      try {
        return await callModel(model, input, input.apiKey, true);
      } catch (error) {
        lastError = error;
        // Некоторые модели не поддерживают JSON mode — повторяем без него.
        try {
          return await callModel(model, input, input.apiKey, false);
        } catch (retryError) {
          lastError = retryError;
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Groq request failed');
  },
};
