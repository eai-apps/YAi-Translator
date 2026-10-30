/**
 * Цепочка провайдеров с автоматическим переключением.
 * Порядок: ключ пользователя (Gemini, затем Groq) → общий Gemini → общий Groq → Workers AI.
 * DeepL в JSON-цепочке не участвует: он умеет только обычный перевод (см. api/translate.ts).
 */
import type { ProviderId } from '../../shared/types';
import type { Env } from './env';
import { ApiError } from './http';
import type { AiProvider, ProviderPrompt } from './providers/types';
import { geminiProvider } from './providers/gemini';
import { groqProvider } from './providers/groq';
import { workersAiProvider } from './providers/workersai';
import { describeError, parseJsonText } from './utils';

export interface UserKeys {
  gemini?: string;
  groq?: string;
}

export interface RunJsonOptions<T> {
  env: Env;
  prompt: ProviderPrompt;
  userKeys: UserKeys;
  signal: AbortSignal;
  /** Приводит ответ модели к типу; null означает «ответ бесполезен, пробуй дальше». */
  validate: (raw: unknown) => T | null;
  /** Ограничить список провайдеров (например, только Workers AI). */
  only?: ProviderId[];
  /** Вызывается перед первой попыткой на общих ключах сайта (дневной лимит). */
  beforeShared?: () => Promise<void>;
}

interface Attempt {
  id: ProviderId;
  apiKey?: string;
  /** true — общий ключ сайта или Workers AI, на них действует дневной лимит. */
  shared: boolean;
}

const PROVIDERS: Partial<Record<ProviderId, AiProvider>> = {
  gemini: geminiProvider,
  groq: groqProvider,
  workersai: workersAiProvider,
} as const;

function buildAttempts(env: Env, userKeys: UserKeys): Attempt[] {
  const attempts: Attempt[] = [];

  // 1. Ключ пользователя имеет приоритет и нигде не сохраняется.
  if (userKeys.gemini) attempts.push({ id: 'gemini', apiKey: userKeys.gemini, shared: false });
  if (userKeys.groq) attempts.push({ id: 'groq', apiKey: userKeys.groq, shared: false });

  // 2. Общие ключи сайта.
  if (env.GEMINI_API_KEY) attempts.push({ id: 'gemini', apiKey: env.GEMINI_API_KEY, shared: true });
  if (env.GROQ_API_KEY) attempts.push({ id: 'groq', apiKey: env.GROQ_API_KEY, shared: true });

  // 3. Последний запасной вариант — Workers AI.
  if (env.AI) attempts.push({ id: 'workersai', shared: true });

  return attempts;
}

export async function runJsonTask<T>(options: RunJsonOptions<T>): Promise<{ data: T; provider: ProviderId }> {
  const attempts = buildAttempts(options.env, options.userKeys).filter(
    (attempt) => !options.only || options.only.includes(attempt.id),
  );

  for (const attempt of attempts) {
    const provider = PROVIDERS[attempt.id];
    if (!provider || !provider.tasks.includes(options.prompt.task)) continue;

    // Ключи пользователя не сработали — дальше идут общие ключи, считаем лимит.
    // Ошибка LIMIT_REACHED отсюда сразу уходит пользователю.
    if (attempt.shared && options.beforeShared) await options.beforeShared();

    try {
      const raw = await provider.generate({
        prompt: options.prompt,
        env: options.env,
        apiKey: attempt.apiKey,
        signal: options.signal,
      });
      const data = options.validate(parseJsonText(raw));
      if (data) return { data, provider: attempt.id };
      console.warn(`Провайдер ${attempt.id} вернул JSON без нужных полей`);
    } catch (error) {
      // Ошибка, лимит или таймаут — молча переходим к следующему провайдеру.
      console.warn(`Провайдер ${attempt.id} не справился: ${describeError(error)}`);
    }
  }

  throw new ApiError('LIMIT_REACHED', 429);
}
