/**
 * Цепочка провайдеров с автоматическим переключением.
 * Порядок: ключ пользователя (Gemini, затем Groq) → общие ключи Gemini по очереди →
 * общие ключи Groq по очереди → Workers AI.
 *
 * Общих ключей может быть несколько (GEMINI_API_KEY, _2 … _5 и ключи из админки).
 * Если ключ ответил 429 / лимит исчерпан, он «отдыхает» до 00:00 UTC, и берётся следующий;
 * 401/403 — ключ помечается неверным (keypool.ts).
 * DeepL и другие обычные переводчики в JSON-цепочке не участвуют (см. api/translate.ts).
 */
import type { ProviderId } from '../../shared/types';
import type { Env } from './env';
import { ApiError } from './http';
import { readDisabledProviders } from './settings';
import { markExhausted, markInvalid, markUsed, usableKeys } from './keystate';
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
  /** Ключ сайта из пула: после ответа нужно записать его состояние. */
  pooledKeyId?: string;
  /** true — общий ключ сайта или Workers AI, на них действует дневной лимит. */
  shared: boolean;
}

const PROVIDERS: Partial<Record<ProviderId, AiProvider>> = {
  gemini: geminiProvider,
  groq: groqProvider,
  workersai: workersAiProvider,
} as const;

/** Статус ответа зашит в текст ошибки провайдеров: «Gemini 429: …», «Groq 401: …». */
function statusOf(error: unknown): number | null {
  const message = error instanceof Error ? error.message : '';
  const match = /\s(\d{3}):/.exec(message);
  return match ? Number(match[1]) : null;
}

async function buildAttempts(env: Env, userKeys: UserKeys): Promise<Attempt[]> {
  const attempts: Attempt[] = [];

  // 1. Ключ пользователя имеет приоритет и нигде не сохраняется.
  if (userKeys.gemini) attempts.push({ id: 'gemini', apiKey: userKeys.gemini, shared: false });
  if (userKeys.groq) attempts.push({ id: 'groq', apiKey: userKeys.groq, shared: false });

  // 2. Общие ключи сайта — рабочие, по очереди (отдыхающие и неверные пропускаются).
  const [geminiKeys, groqKeys] = await Promise.all([usableKeys(env, 'gemini'), usableKeys(env, 'groq')]);
  for (const key of geminiKeys) {
    attempts.push({ id: 'gemini', apiKey: key.key, pooledKeyId: key.id, shared: true });
  }
  for (const key of groqKeys) {
    attempts.push({ id: 'groq', apiKey: key.key, pooledKeyId: key.id, shared: true });
  }

  // 3. Последний запасной вариант — Workers AI.
  if (env.AI) attempts.push({ id: 'workersai', shared: true });

  return attempts;
}

export async function runJsonTask<T>(options: RunJsonOptions<T>): Promise<{ data: T; provider: ProviderId }> {
  const disabled = await readDisabledProviders(options.env);
  const attempts = (await buildAttempts(options.env, options.userKeys)).filter(
    // Выключенный в админке ИИ не используется даже с ключом пользователя.
    (attempt) => (!options.only || options.only.includes(attempt.id)) && !disabled.has(attempt.id),
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
      if (data) {
        if (attempt.pooledKeyId) void markUsed(options.env, attempt.id as 'gemini' | 'groq', attempt.pooledKeyId);
        return { data, provider: attempt.id };
      }
      console.warn(`Провайдер ${attempt.id} вернул JSON без нужных полей`);
    } catch (error) {
      const message = describeError(error);
      console.warn(`Провайдер ${attempt.id} не справился: ${message}`);
      // Состояние общих ключей: исчерпанный «отдыхает», неверный больше не используется.
      if (attempt.pooledKeyId) {
        const status = statusOf(error);
        const poolId = attempt.id as 'gemini' | 'groq';
        if (status === 429) await markExhausted(options.env, poolId, attempt.pooledKeyId, message);
        else if (status === 401 || status === 403) await markInvalid(options.env, poolId, attempt.pooledKeyId, message);
        // Прочие ошибки (таймаут, битый JSON) ключ не портят — просто пробуем следующий.
      }
    }
  }

  throw new ApiError('LIMIT_REACHED', 429);
}
