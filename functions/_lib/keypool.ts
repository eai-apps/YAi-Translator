/**
 * Пул общих ключей сайта (версия 0.4.0).
 *
 * Ключи одного сервиса берутся из двух мест:
 *   (а) переменные Cloudflare: GEMINI_API_KEY, GEMINI_API_KEY_2 … _5 — так же для Groq, DeepL,
 *       Microsoft, Google и пары LARA_ACCESS_KEY_ID / LARA_ACCESS_KEY_SECRET;
 *   (б) ключи, добавленные в админке, — таблица site_keys (зашифрованы AES-GCM).
 *
 * Правила состояния (таблица key_state, сам ключ там не хранится):
 *   - ответ 429 / квота исчерпана → ключ «отдыхает» до 00:00 UTC, берём следующий;
 *   - ответ 401/403 → ключ помечается неверным и больше не используется.
 */
import type { SiteKeyProvider } from '../../shared/types';
import { decryptKey } from './auth/crypto';
import { KEY_POOL } from './config';
import type { Env } from './env';
import { ensureSchema } from './schema';
import { sha256Hex } from './utils';

export interface PooledKey {
  provider: SiteKeyProvider;
  /** Откуда ключ: переменная Cloudflare или строка в site_keys. */
  source: 'cloudflare' | 'admin';
  /** Первые 12 символов SHA-256 ключа. */
  id: string;
  /** Сам секрет. Для Lara это id ключа, а secret лежит в secretPart. */
  key: string;
  /** Вторая часть пары (только Lara). */
  secretPart?: string;
  /** Регион Microsoft Translator (из MICROSOFT_TRANSLATOR_REGION или сохранён в админке). */
  region?: string;
  /** Последние 4 символа для показа «••••1234». */
  last4: string;
}

/** Имена переменных окружения для каждого сервиса. */
const ENV_NAMES: Record<SiteKeyProvider, string> = {
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  deepl: 'DEEPL_API_KEY',
  microsoft: 'MICROSOFT_TRANSLATOR_KEY',
  google: 'GOOGLE_TRANSLATE_KEY',
  lara: 'LARA_ACCESS_KEY_ID',
};

export function isSiteKeyProvider(value: unknown): value is SiteKeyProvider {
  return typeof value === 'string' && value in ENV_NAMES;
}

/** Контекст шифрования ключа из админки: site:<provider>:<id>. */
export function siteKeyContext(provider: SiteKeyProvider, id: string): string {
  return `site:${provider}:${id}`;
}

/** Неизвестные переменные окружения (например, GEMINI_API_KEY_2) читаются по имени. */
function envValue(env: Env, name: string): string | undefined {
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function keyIdOf(key: string): Promise<string> {
  return (await sha256Hex(key)).slice(0, 12);
}

/** Ключи из переменных Cloudflare (без состояния: оно проверяется позже). */
export async function envKeys(env: Env, provider: SiteKeyProvider): Promise<PooledKey[]> {
  const base = ENV_NAMES[provider];
  const keys: PooledKey[] = [];

  for (let index = 1; index <= KEY_POOL.maxEnvKeys; index += 1) {
    const suffix = index === 1 ? '' : `_${index}`;
    const value = envValue(env, `${base}${suffix}`);
    if (!value) continue;

    if (provider === 'lara') {
      const secret = envValue(env, `LARA_ACCESS_KEY_SECRET${suffix}`);
      if (!secret) continue;
      keys.push({
        provider,
        source: 'cloudflare',
        id: await keyIdOf(`${value}:${secret}`),
        key: value,
        secretPart: secret,
        last4: secret.slice(-4),
      });
      continue;
    }

    keys.push({
      provider,
      source: 'cloudflare',
      id: await keyIdOf(value),
      key: value,
      region: provider === 'microsoft' ? envValue(env, 'MICROSOFT_TRANSLATOR_REGION') : undefined,
      last4: value.slice(-4),
    });
  }
  return keys;
}

interface SiteKeyRow {
  id: string;
  provider: string;
  ciphertext: string;
  iv: string;
  last4: string;
  region: string | null;
  created_at: number;
  created_by: string | null;
}

/** Ключи из таблицы site_keys, расшифрованные. */
export async function adminKeys(env: Env, provider: SiteKeyProvider): Promise<PooledKey[]> {
  if (!env.DB || !env.KEY_ENCRYPTION_SECRET) return [];
  try {
    await ensureSchema(env);
    const result = await env.DB.prepare('SELECT * FROM site_keys WHERE provider = ? ORDER BY created_at ASC')
      .bind(provider)
      .all<SiteKeyRow>();
    const keys: PooledKey[] = [];
    for (const row of result.results ?? []) {
      try {
        const plain = await decryptKey(env, row.ciphertext, row.iv, siteKeyContext(provider, row.id));
        // Lara: в шифротексте «id:secret», поэтому делим по первому двоеточию.
        const separator = provider === 'lara' ? plain.indexOf(':') : -1;
        keys.push({
          provider,
          source: 'admin',
          id: row.id,
          key: separator > 0 ? plain.slice(0, separator) : plain,
          secretPart: separator > 0 ? plain.slice(separator + 1) : undefined,
          region: row.region ?? undefined,
          last4: row.last4,
        });
      } catch {
        // Ключ не расшифровался (сменили KEY_ENCRYPTION_SECRET) — пропускаем.
        console.warn(`Ключ ${provider} из админки не расшифровался`);
      }
    }
    return keys;
  } catch (error) {
    console.warn('Ключи из админки недоступны:', error instanceof Error ? error.message : error);
    return [];
  }
}

/** Все ключи сервиса: сначала переменные Cloudflare, за ними — добавленные в админке. */
export async function allKeys(env: Env, provider: SiteKeyProvider): Promise<PooledKey[]> {
  const [fromEnv, fromAdmin] = await Promise.all([envKeys(env, provider), adminKeys(env, provider)]);
  return [...fromEnv, ...fromAdmin];
}

/** Есть ли у сервиса хотя бы один ключ (даже отдыхающий) — для /api/health. */
export async function hasAnyKey(env: Env, provider: SiteKeyProvider): Promise<boolean> {
  return (await allKeys(env, provider)).length > 0;
}
