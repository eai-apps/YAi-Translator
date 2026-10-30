/**
 * «Ключи сайта» в админке: список ключей каждого сервиса, добавление и удаление.
 * Ключи из переменных Cloudflare — только просмотр; добавленные в админке хранятся
 * в site_keys зашифрованными (encryptKey, контекст site:<provider>:<id>).
 */
import type { KeyHealth, SiteKeyInfo, SiteKeyProvider, SiteKeyTestResponse } from '../../../shared/types';
import { deeplUrl, GEMINI, GROQ, LARA } from '../config';
import type { Env } from '../env';
import { encryptKey } from '../auth/crypto';
import { ensureSchema } from '../schema';
import { laraContentMd5, laraSignature } from '../classic/lara';
import { allKeys, siteKeyContext } from '../keypool';
import { loadKeyStates, markHealthy, usableKeys } from '../keystate';
import type { PooledKey } from '../keypool';
import { withTimeoutSignal } from '../utils';

/** Состояние ключа в понятном виде: работает / отдыхает до … / неверный. */
function healthOf(state: { exhaustedUntil: number | null; invalid: boolean } | undefined): KeyHealth {
  if (!state) return 'ok';
  if (state.invalid) return 'invalid';
  if (state.exhaustedUntil && state.exhaustedUntil > Date.now()) return 'resting';
  return 'ok';
}

/** Все ключи одного или всех сервисов с состоянием из key_state. */
export async function listSiteKeys(env: Env, provider?: SiteKeyProvider): Promise<SiteKeyInfo[]> {
  const providers: SiteKeyProvider[] = provider
    ? [provider]
    : ['gemini', 'groq', 'deepl', 'microsoft', 'google', 'lara'];

  const result: SiteKeyInfo[] = [];
  for (const current of providers) {
    const [keys, states] = await Promise.all([allKeys(env, current), loadKeyStates(env, current)]);
    for (const key of keys) {
      const state = states[key.id];
      result.push({
        id: key.id,
        provider: current,
        source: key.source,
        mask: `••••${key.last4}`,
        health: healthOf(state),
        exhaustedUntil: state?.exhaustedUntil ?? null,
        lastError: state?.lastError ?? null,
        lastUsedAt: state?.lastUsedAt ?? null,
        addedAt: null,
      });
    }
  }

  // Дата добавления есть только у ключей админки.
  if (env.DB) {
    try {
      await ensureSchema(env);
      const rows = await env.DB.prepare('SELECT id, created_at FROM site_keys').all<{ id: string; created_at: number }>();
      const dates = new Map((rows.results ?? []).map((row) => [row.id, row.created_at]));
      for (const key of result) key.addedAt = key.source === 'admin' ? (dates.get(key.id) ?? null) : null;
    } catch {
      // Без дат список всё равно полезен.
    }
  }
  return result;
}

/** Резервные ключи попадают в адресную строку ошибок только по окончанию — так безопаснее. */
function tail(key: string): string {
  return key.slice(-4);
}

/** Настоящая проверка одного ключа перед сохранением и по кнопке «Проверить». */
export async function testSiteKey(
  provider: SiteKeyProvider,
  key: string,
  secret: string | undefined,
  region: string | undefined,
): Promise<SiteKeyTestResponse> {
  const started = Date.now();
  const { signal, clear } = withTimeoutSignal(undefined, 10_000);
  try {
    let ok = false;
    if (provider === 'gemini') {
      const response = await fetch(`${GEMINI.baseUrl}/${GEMINI.models[0]}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with exactly one word: OK' }] }],
          generationConfig: { maxOutputTokens: 32, temperature: 0 },
        }),
        signal,
      });
      ok = response.ok;
    } else if (provider === 'groq') {
      const response = await fetch(GROQ.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: GROQ.models[0],
          messages: [{ role: 'user', content: 'Reply with exactly one word: OK' }],
          max_tokens: 4,
          temperature: 0,
        }),
        signal,
      });
      ok = response.ok;
    } else if (provider === 'deepl') {
      const response = await fetch(deeplUrl(key, 'usage'), {
        headers: { Authorization: `DeepL-Auth-Key ${key}` },
        signal,
      });
      ok = response.ok;
    } else if (provider === 'microsoft') {
      const url = new URL('https://api.cognitive.microsofttranslator.com/translate');
      url.searchParams.set('api-version', '3.0');
      url.searchParams.set('to', 'ru');
      url.searchParams.set('from', 'de');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': key,
      };
      if (region) headers['Ocp-Apim-Subscription-Region'] = region;
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify([{ Text: 'Hallo' }]),
        signal,
      });
      ok = response.ok;
    } else if (provider === 'google') {
      const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ q: 'Hallo', target: 'ru', source: 'de', format: 'text' }),
        signal,
      });
      ok = response.ok;
    } else {
      // Lara: пара «id + secret», проверяем подпись авторизации.
      const date = new Date().toUTCString();
      const body = JSON.stringify({ id: key });
      const md5 = await laraContentMd5(body);
      const signature = await laraSignature(secret ?? '', 'POST', '/v2/auth', md5, 'application/json', date);
      const response = await fetch(`${LARA.baseUrl}/v2/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Lara-Date': date,
          'Content-MD5': md5,
          Authorization: `Lara:${signature}`,
        },
        body,
        signal,
      });
      ok = response.ok;
    }

    const latencyMs = Date.now() - started;
    return {
      ok,
      latencyMs,
      message: ok ? null : `Сервис ответил отказом (ключ ${tail(key)}).`,
    };
  } catch {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      message: 'Сервис не ответил за 10 секунд. Проверьте интернет и ключ.',
    };
  } finally {
    clear();
  }
}

/** Шифрует и сохраняет ключ из админки. Ключ уже проверен настоящим запросом. */
export async function addSiteKey(
  env: Env,
  provider: SiteKeyProvider,
  key: string,
  secret: string | undefined,
  region: string | undefined,
  adminLogin: string,
): Promise<SiteKeyInfo> {
  if (!env.DB) throw new Error('D1 недоступна');
  await ensureSchema(env);

  // Ограничения на количество ключей нет: сервис работает, пока есть хотя бы один рабочий.
  const id = crypto.randomUUID();
  // Lara хранит пару «id:secret» одной строкой, остальные — просто ключ.
  const plain = provider === 'lara' ? `${key}:${secret ?? ''}` : key;
  const { ciphertext, iv } = await encryptKey(env, plain, siteKeyContext(provider, id));

  await env.DB.prepare(
    `INSERT INTO site_keys (id, provider, ciphertext, iv, last4, region, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, provider, ciphertext, iv, tail(key), region ?? null, Date.now(), adminLogin)
    .run();

  return {
    id,
    provider,
    source: 'admin',
    mask: `••••${tail(key)}`,
    health: 'ok',
    exhaustedUntil: null,
    lastError: null,
    lastUsedAt: null,
    addedAt: Date.now(),
  };
}

/** Удаляет ключ из админки вместе с его состоянием. */
export async function deleteSiteKey(env: Env, provider: SiteKeyProvider, id: string): Promise<boolean> {
  if (!env.DB) return false;
  await ensureSchema(env);
  const row = await env.DB.prepare('SELECT provider FROM site_keys WHERE id = ?').bind(id).first<{ provider: string }>();
  if (!row || row.provider !== provider) return false;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM site_keys WHERE id = ?').bind(id),
    env.DB.prepare('DELETE FROM key_state WHERE provider = ? AND key_id = ?').bind(provider, id),
  ]);
  return true;
}

/**
 * Проверяет ключ по кнопке «Проверить»: берёт первый рабочий ключ сервиса.
 * Рабочего нет — проверяем первый из имеющихся, чтобы показать настоящую причину;
 * ответивший ключ в этом случае снова считается рабочим (markHealthy ниже).
 */
export async function testStoredKey(env: Env, provider: SiteKeyProvider): Promise<SiteKeyTestResponse> {
  const usable = await usableKeys(env, provider);
  const candidates: PooledKey[] = usable.length > 0 ? usable : await allKeys(env, provider);
  const key = candidates[0];
  if (!key) {
    return { ok: false, latencyMs: 0, message: 'У этого сервиса нет ключей. Добавьте ключ ниже.' };
  }
  const result = await testSiteKey(provider, key.key, key.secretPart, key.region ?? env.MICROSOFT_TRANSLATOR_REGION);
  // Живой ответ снимает отметку «неверный» / «отдыхает».
  if (result.ok) await markHealthy(env, provider, key.id);
  return result;
}
