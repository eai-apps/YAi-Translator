/**
 * Lara Translate — бесплатный тариф без банковской карты.
 * REST API: https://api.laratranslate.com. Ключи: LARA_ACCESS_KEY_ID и LARA_ACCESS_KEY_SECRET.
 *
 * Подпись запроса взята из официального SDK @translated/lara (src/net/lara/client.ts):
 *   1. POST /v2/auth  { id }  с заголовками
 *        X-Lara-Date: <UTC-дата>
 *        Content-MD5: base64(первые 16 байт SHA-256 от тела)
 *        Content-Type: application/json
 *        Authorization: Lara:<HMAC-SHA256(secret, "POST\n/auth\n<Content-MD5>\n<Content-Type>\n<X-Lara-Date>")>
 *      в ответ приходит токен { token }.
 *   2. POST /v2/translate  { q, source, target }  с Authorization: Bearer <token>.
 * Время обеих дат одинаковое — так подпись не зависит от часов сервера.
 */
import { getLanguage } from '../../../shared/languages';
import type { LanguageCode } from '../../../shared/types';
import { LARA } from '../config';
import { usableKeys } from '../keystate';
import { markExhausted, markInvalid, markUsed } from '../keystate';
import type { PooledKey } from '../keypool';
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

const AUTH_PATH = '/v2/auth';
const TRANSLATE_PATH = '/v2/translate';

interface LaraAuthResponse {
  token?: string;
}

interface LaraTranslateResponse {
  translation?: string | string[] | Array<{ text?: string }>;
}

/** Код языка Lara: pt-PT, de-DE, ar-SA — как speechCode в shared/languages.ts. */
function laraLanguage(code: LanguageCode): string | null {
  return getLanguage(code)?.speechCode ?? null;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

async function hmacBase64(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64(new Uint8Array(signature));
}

/** Content-MD5 по документации Lara — первые 16 байт SHA-256, в base64. */
export async function laraContentMd5(body: string): Promise<string> {
  return base64((await sha256Bytes(body)).slice(0, 16));
}

/** Строка подписи и её HMAC — то же, что делает SDK. */
export async function laraSignature(
  secret: string,
  method: string,
  path: string,
  contentMd5: string,
  contentType: string,
  date: string,
): Promise<string> {
  const challenge = `${method.toUpperCase()}\n${path}\n${contentMd5}\n${contentType}\n${date}`;
  return hmacBase64(secret, challenge);
}

class LaraError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Один ключ: авторизация, затем перевод. */
async function callLara(
  key: PooledKey,
  text: string,
  source: string | null,
  target: string,
  signal: AbortSignal,
): Promise<string> {
  const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, LARA.timeoutMs);
  try {
    // Обе даты одинаковые: подпись и запрос идут с одной меткой времени.
    const date = new Date().toUTCString();
    const secret = key.secretPart ?? '';

    const authBody = JSON.stringify({ id: key.key });
    const authMd5 = await laraContentMd5(authBody);
    const authSignature = await laraSignature(secret, 'POST', AUTH_PATH, authMd5, 'application/json', date);

    const authResponse = await fetch(`${LARA.baseUrl}${AUTH_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Lara-Date': date,
        'Content-MD5': authMd5,
        Authorization: `Lara:${authSignature}`,
      },
      body: authBody,
      signal: timeoutSignal,
    });

    if (!authResponse.ok) {
      throw new LaraError(authResponse.status, `Lara auth ${authResponse.status}`);
    }
    const auth = (await authResponse.json().catch(() => ({}))) as LaraAuthResponse;
    if (!auth.token) throw new LaraError(500, 'Lara auth без токена');

    const translateResponse = await fetch(`${LARA.baseUrl}${TRANSLATE_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ q: text, source, target }),
      signal: timeoutSignal,
    });

    if (!translateResponse.ok) {
      throw new LaraError(translateResponse.status, `Lara translate ${translateResponse.status}`);
    }
    const data = (await translateResponse.json().catch(() => ({}))) as LaraTranslateResponse;
    const translation = data.translation;
    const translated =
      typeof translation === 'string'
        ? translation
        : Array.isArray(translation)
          ? translation
              .map((item) => (typeof item === 'string' ? item : (item.text ?? '')))
              .join(' ')
          : '';
    const trimmed = translated.trim();
    if (!trimmed) throw new LaraError(500, 'Lara вернул пустой ответ');
    return trimmed;
  } finally {
    clear();
  }
}

export const laraTranslator: ClassicTranslator = {
  id: 'lara',
  supportsAutoDetect: true,
  isConfigured: (env) => Boolean(env.LARA_ACCESS_KEY_ID && env.LARA_ACCESS_KEY_SECRET),

  async translate({ env, text, sourceLang, targetLang, signal }) {
    const target = laraLanguage(targetLang);
    const source = sourceLang === 'auto' ? null : laraLanguage(sourceLang);
    if (!target) return null;

    const keys = await usableKeys(env, 'lara');
    for (const key of keys) {
      try {
        const translated = await callLara(key, text, source, target, signal);
        void markUsed(env, 'lara', key.id);
        return { text: translated, detectedLang: null };
      } catch (error) {
        const status = error instanceof LaraError ? error.status : 0;
        const note = error instanceof Error ? error.message : 'ошибка Lara';
        console.warn(note);
        if (status === 401 || status === 403) await markInvalid(env, 'lara', key.id, note);
        else if (status === 429) await markExhausted(env, 'lara', key.id, note);
        // 5xx и сеть — ключ не виноват, просто пробуем следующий.
      }
    }
    return null;
  },
};

/** Проверка пары ключей для админки: авторизация без перевода. */
export async function testLaraCredentials(
  key: string,
  secret: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number }> {
  const date = new Date().toUTCString();
  const body = JSON.stringify({ id: key });
  const md5 = await laraContentMd5(body);
  const signature = await laraSignature(secret, 'POST', AUTH_PATH, md5, 'application/json', date);
  const response = await fetch(`${LARA.baseUrl}${AUTH_PATH}`, {
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
  return { ok: response.ok, status: response.status };
}
