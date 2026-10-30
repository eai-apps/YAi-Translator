/** Cloudflare Workers AI — последний запасной провайдер, работает на бесплатном тарифе. */
import type { AiProvider, GenerateInput } from './types';
import { WORKERS_AI } from '../config';
import { withTimeoutSignal } from '../utils';

interface WorkersAiResponse {
  response?: string;
}

export const workersAiProvider: AiProvider = {
  id: 'workersai',
  tasks: ['translate', 'word', 'explain', 'check'],

  async generate(input: GenerateInput) {
    if (!input.env.AI) throw new Error('Workers AI binding is not configured');

    const { signal, clear } = withTimeoutSignal(input.signal, WORKERS_AI.timeoutMs);
    try {
      if (signal.aborted) throw new Error('Workers AI request aborted');

      // У binding нет своего signal, поэтому обрываем ожидание через гонку с таймаутом.
      const request = input.env.AI.run(WORKERS_AI.model, {
        messages: [
          { role: 'system', content: input.prompt.system },
          { role: 'user', content: input.prompt.user },
        ],
        max_tokens: WORKERS_AI.maxOutputTokens,
        temperature: 0.2,
      });
      const aborted = new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Workers AI request aborted')), {
          once: true,
        });
      });

      const result = (await Promise.race([request, aborted])) as WorkersAiResponse | string;

      const text = (typeof result === 'string' ? result : result.response ?? '').trim();
      if (!text) throw new Error('Workers AI returned an empty answer');
      return text;
    } finally {
      clear();
    }
  },
};
