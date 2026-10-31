/** Google Gemini — бесплатные модели Flash-Lite / Flash. */
import type { AiProvider, GenerateInput } from './types';
import { GEMINI } from '../config';
import { withTimeoutSignal } from '../utils';

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

async function callModel(model: string, input: GenerateInput, apiKey: string): Promise<string> {
  const { signal, clear } = withTimeoutSignal(input.signal, GEMINI.timeoutMs);
  try {
    const response = await fetch(`${GEMINI.baseUrl}/${model}:generateContent`, {
      method: 'POST',
      // Ключ в заголовке, а не в адресе: адреса попадают в логи.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.prompt.system }] },
        contents: [{ role: 'user', parts: [{ text: input.prompt.user }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: GEMINI.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;
    if (!response.ok) {
      throw new Error(`Gemini ${response.status}: ${data.error?.message ?? 'request failed'}`);
    }
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
    }

    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) throw new Error('Gemini returned an empty answer');
    return text;
  } finally {
    clear();
  }
}

export const geminiProvider: AiProvider = {
  id: 'gemini',
  tasks: ['translate', 'word', 'explain', 'check', 'grammar', 'ask'],

  async generate(input) {
    if (!input.apiKey) throw new Error('Gemini API key is missing');
    let lastError: unknown = null;

    // Если модель недоступна в регионе или удалена, пробуем следующую.
    for (const model of GEMINI.models) {
      try {
        return await callModel(model, input, input.apiKey);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Gemini request failed');
  },
};
