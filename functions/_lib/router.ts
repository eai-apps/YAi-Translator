/**
 * Цепочка провайдеров с автоматическим переключением.
 * Порядок: личный ключ пользователя (paid → Gemini → Groq) → общие ключи сайта →
 * Workers AI.
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
import { paidProvider } from './providers/paid';
import { getUsableSharedPaidModels, recordPaidTokens } from './paid/manager';
import { describeError, parseJsonText } from './utils';

export interface UserKeys {
  gemini?: string;
  groq?: string;
  /** Платная нейросеть по ключу пользователя. */
  paidUrl?: string;
  paidKey?: string;
  paidModel?: string;
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
  /** true — только личные ключи пользователя, без общих ключей сайта. */
  personalOnly?: boolean;
  /** Вызывается перед первой попыткой на общих ключах сайта (дневной лимит). */
  beforeShared?: () => Promise<void>;
  /** true — пользователь авторизован (для бонусов и платных моделей). */
  isRegistered?: boolean;
}

interface Attempt {
  id: ProviderId;
  apiKey?: string;
  /** Доп. параметры для paid-провайдера. */
  baseUrl?: string;
  paidModel?: string;
  /** Ключ сайта из пула: после ответа нужно записать его состояние. */
  pooledKeyId?: string;
  /** true — общий ключ сайта или Workers AI, на них действует дневной лимит. */
  shared: boolean;
}

const PROVIDERS: Partial<Record<ProviderId, AiProvider>> = {
  gemini: geminiProvider,
  groq: groqProvider,
  workersai: workersAiProvider,
  paid: paidProvider,
} as const;

/** Статус ответа зашит в текст ошибки провайдеров: «Gemini 429: …», «Groq 401: …». */
function statusOf(error: unknown): number | null {
  const message = error instanceof Error ? error.message : '';
  const match = /\s(\d{3}):/.exec(message);
  return match ? Number(match[1]) : null;
}

async function buildAttempts(env: Env, userKeys: UserKeys, isRegistered = false): Promise<Attempt[]> {
  const attempts: Attempt[] = [];

  // 1. Платная нейросеть пользователя — самый высокий приоритет среди личных ключей.
  if (userKeys.paidUrl && userKeys.paidKey && userKeys.paidModel) {
    attempts.push({
      id: 'paid',
      apiKey: userKeys.paidKey,
      baseUrl: userKeys.paidUrl,
      paidModel: userKeys.paidModel,
      shared: false,
    });
  }

  // 2. Бесплатные личные ключи.
  if (userKeys.gemini) attempts.push({ id: 'gemini', apiKey: userKeys.gemini, shared: false });
  if (userKeys.groq) attempts.push({ id: 'groq', apiKey: userKeys.groq, shared: false });

  // 3. Общие бесплатные ключи сайта.
  const [geminiKeys, groqKeys] = await Promise.all([usableKeys(env, 'gemini'), usableKeys(env, 'groq')]);
  const freeShared: Attempt[] = [];
  for (const key of geminiKeys) {
    freeShared.push({ id: 'gemini', apiKey: key.key, pooledKeyId: key.id, shared: true });
  }
  for (const key of groqKeys) {
    freeShared.push({ id: 'groq', apiKey: key.key, pooledKeyId: key.id, shared: true });
  }

  // 4. Общие платные модели сайта.
  const { order, models: sharedPaid } = await getUsableSharedPaidModels(env, isRegistered);
  const paidShared: Attempt[] = sharedPaid.map((m) => ({
    id: 'paid',
    apiKey: m.apiKey,
    baseUrl: m.baseUrl,
    paidModel: m.model,
    pooledKeyId: m.connectionId,
    shared: true,
  }));

  if (order === 'paid_first') {
    attempts.push(...paidShared, ...freeShared);
  } else if (order === 'free_first') {
    attempts.push(...freeShared, ...paidShared);
  } else {
    attempts.push(...freeShared);
  }

  // 5. Последний запасной вариант — Workers AI.
  if (env.AI) attempts.push({ id: 'workersai', shared: true });

  return attempts;
}

export async function runJsonTask<T>(options: RunJsonOptions<T>): Promise<{ data: T; provider: ProviderId }> {
  const disabled = await readDisabledProviders(options.env);
  const attempts = (await buildAttempts(options.env, options.userKeys, options.isRegistered)).filter(
    (attempt) =>
      (!options.only || options.only.includes(attempt.id)) &&
      !disabled.has(attempt.id) &&
      (!options.personalOnly || !attempt.shared),
  );

  for (const attempt of attempts) {
    const provider = PROVIDERS[attempt.id];
    if (!provider || !provider.tasks.includes(options.prompt.task)) continue;

    // Ключи пользователя не сработали — дальше идут общие ключи, считаем лимит.
    if (attempt.shared && options.beforeShared) await options.beforeShared();

    try {
      let usedTokens = 0;
      const generateInput = {
        prompt: options.prompt,
        env: options.env,
        apiKey: attempt.apiKey,
        signal: options.signal,
        ...(attempt.baseUrl ? { baseUrl: attempt.baseUrl } : {}),
        ...(attempt.paidModel ? { paidModel: attempt.paidModel } : {}),
        onUsage: (tokens: number) => {
          usedTokens = tokens;
        },
      };
      const raw = await provider.generate(generateInput as Parameters<typeof provider.generate>[0]);
      const data = options.validate(parseJsonText(raw));
      if (data) {
        if (attempt.pooledKeyId && attempt.id !== 'paid') {
          void markUsed(options.env, attempt.id as 'gemini' | 'groq', attempt.pooledKeyId);
        } else if (attempt.pooledKeyId && attempt.id === 'paid' && usedTokens > 0) {
          void recordPaidTokens(options.env, usedTokens);
        }
        return { data, provider: attempt.id };
      }
      console.warn(`Провайдер ${attempt.id} вернул JSON без нужных полей`);
    } catch (error) {
      const message = describeError(error);
      console.warn(`Провайдер ${attempt.id} не справился: ${message}`);
      if (attempt.pooledKeyId) {
        const status = statusOf(error);
        if (attempt.id === 'paid') {
          console.warn(`Платное подключение ${attempt.pooledKeyId} вернуло ошибку ${status}: ${message}`);
        } else {
          const poolId = attempt.id as 'gemini' | 'groq';
          if (status === 429) await markExhausted(options.env, poolId, attempt.pooledKeyId, message);
          else if (status === 401 || status === 403) await markInvalid(options.env, poolId, attempt.pooledKeyId, message);
        }
      }
    }
  }

  throw new ApiError('LIMIT_REACHED', 429);
}
