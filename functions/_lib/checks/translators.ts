/**
 * Проверка обычных переводчиков без ИИ: DeepL, Lara, Microsoft, Google, MyMemory, M2M100.
 * Проверяем сам ответ сервиса, а не текст перевода: у MyMemory для коротких слов
 * перевод бывает пустым, и это не поломка. Для DeepL хватает запроса расхода.
 * DB, Lara, Microsoft и Google проверяются первым рабочим ключом из пула.
 */
import type { ServiceCheck, UiLanguage } from '../../../shared/types';
import { CLASSIC, deeplUrl, HEALTH_CHECK, LARA } from '../config';
import type { Env } from '../env';
import { allKeys } from '../keypool';
import { usableKeys } from '../keystate';
import type { PooledKey } from '../keypool';
import { laraContentMd5, laraSignature } from '../classic/lara';
import { withTimeoutSignal } from '../utils';
import { messages } from './messages';

/** Общий вид проверки: true — сервис ответил без ошибки. */
async function probe(
  service: string,
  uiLang: UiLanguage,
  run: (signal: AbortSignal) => Promise<boolean>,
): Promise<ServiceCheck> {
  const started = Date.now();
  const { signal, clear } = withTimeoutSignal(undefined, HEALTH_CHECK.timeoutMs);
  try {
    const ok = await run(signal);
    const latencyMs = Date.now() - started;
    return ok ? { ok: true, latencyMs, message: null } : messages.status(service, 0, latencyMs, uiLang);
  } catch {
    return messages.unreachable(service, Date.now() - started, uiLang);
  } finally {
    clear();
  }
}

/**
 * Первый рабочий ключ сервиса (отдыхающие и неверные пропускаются).
 * Если ключи есть, но все отдыхают или неверные, — возвращаем первый из них:
 * проверка честно покажет причину, а не «ключ не задан».
 */
async function firstKey(env: Env, provider: 'deepl' | 'lara' | 'microsoft' | 'google'): Promise<PooledKey | null> {
  const usable = await usableKeys(env, provider);
  if (usable.length > 0) return usable[0];
  const all = await allKeys(env, provider);
  return all[0] ?? null;
}

export async function checkDeepL(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  const key = await firstKey(env, 'deepl');
  if (!key) return messages.notConfigured(uiLang);
  return probe('DeepL', uiLang, async (signal) => {
    const response = await fetch(deeplUrl(key.key, 'usage'), {
      headers: { Authorization: `DeepL-Auth-Key ${key.key}` },
      signal,
    });
    return response.ok;
  });
}

export async function checkLara(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  const key = await firstKey(env, 'lara');
  if (!key) return messages.notConfigured(uiLang);
  return probe('Lara', uiLang, async (signal) => {
    // Проверяем подпись ключа: тот же запрос авторизации, что и при переводе.
    const date = new Date().toUTCString();
    const body = JSON.stringify({ id: key.key });
    const md5 = await laraContentMd5(body);
    const signature = await laraSignature(key.secretPart ?? '', 'POST', '/v2/auth', md5, 'application/json', date);
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
    return response.ok;
  });
}

export async function checkMicrosoft(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  const key = await firstKey(env, 'microsoft');
  if (!key) return messages.notConfigured(uiLang);
  return probe('Microsoft Translator', uiLang, async (signal) => {
    const url = new URL(CLASSIC.microsoftUrl);
    url.searchParams.set('api-version', '3.0');
    url.searchParams.set('to', 'ru');
    url.searchParams.set('from', 'de');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': key.key,
    };
    const region = key.region ?? env.MICROSOFT_TRANSLATOR_REGION;
    if (region) headers['Ocp-Apim-Subscription-Region'] = region;
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify([{ Text: HEALTH_CHECK.sampleText }]),
      signal,
    });
    return response.ok;
  });
}

export async function checkGoogle(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  const key = await firstKey(env, 'google');
  if (!key) return messages.notConfigured(uiLang);
  return probe('Google Translate', uiLang, async (signal) => {
    const response = await fetch(CLASSIC.googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key.key,
      },
      body: JSON.stringify({ q: HEALTH_CHECK.sampleText, target: 'ru', source: 'de', format: 'text' }),
      signal,
    });
    return response.ok;
  });
}

export function checkMyMemory(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  return probe('MyMemory', uiLang, async (signal) => {
    const url = new URL(CLASSIC.myMemoryUrl);
    url.searchParams.set('q', HEALTH_CHECK.sampleText);
    url.searchParams.set('langpair', 'de|ru');
    if (env.MYMEMORY_EMAIL) url.searchParams.set('de', env.MYMEMORY_EMAIL);
    const response = await fetch(url.toString(), { signal });
    if (!response.ok) return false;
    const data = (await response.json().catch(() => ({}))) as {
      responseStatus?: number | string;
      quotaFinished?: boolean;
    };
    // Исчерпанный дневной лимит MyMemory — не поломка, но и не рабочий доступ.
    return !data.quotaFinished && String(data.responseStatus) === '200';
  });
}

export function checkM2M100(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  if (!env.AI) return Promise.resolve(messages.notConfigured(uiLang));
  return probe('M2M100', uiLang, async (signal) => {
    const request = env.AI!.run(CLASSIC.m2m100Model, {
      text: HEALTH_CHECK.sampleText,
      source_lang: 'de',
      target_lang: 'ru',
    });
    const aborted = new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
    });
    const result = (await Promise.race([request, aborted])) as unknown;
    return typeof result === 'object' && result !== null;
  });
}
