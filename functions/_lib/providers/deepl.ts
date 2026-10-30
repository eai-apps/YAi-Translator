/**
 * DeepL API Free — только обычный перевод текста, без грамматических разборов.
 * Общих ключей может быть несколько (DEEPL_API_KEY, _2 … и добавленные в админке):
 * ключи перебираются через пул keypool.ts.
 */
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { getLanguage } from '../../../shared/languages';
import { DEEPL, deeplUrl } from '../config';
import type { Env } from '../env';
import { usableKeys } from '../keystate';
import { markExhausted, markInvalid, markUsed } from '../keystate';
import type { PooledKey } from '../keypool';
import { withTimeoutSignal } from '../utils';

interface DeepLResponse {
  translations?: Array<{ text?: string }>;
  message?: string;
}

/** Код языка для DeepL: как цель португальский — PT-PT, как источник — PT. */
export function deeplLanguage(code: LanguageCode, role: 'source' | 'target'): string | null {
  const mapped = getLanguage(code)?.deeplCode;
  if (!mapped) return null;
  if (role === 'source') return mapped.split('-')[0];
  return mapped;
}

/** Один запрос с одним ключом. Исчерпанная квота DeepL приходит с кодом 456. */
async function callDeepL(
  key: PooledKey,
  body: URLSearchParams,
  signal: AbortSignal,
): Promise<{ ok: true; text: string } | { ok: false; kind: 'exhausted' | 'invalid' | 'failed'; note: string }> {
  const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, DEEPL.timeoutMs);
  try {
    const response = await fetch(deeplUrl(key.key, 'translate'), {
      method: 'POST',
      // С ноября 2025 DeepL принимает ключ только в заголовке Authorization.
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `DeepL-Auth-Key ${key.key}`,
      },
      body: body.toString(),
      signal: timeoutSignal,
    });

    const data = (await response.json().catch(() => ({}))) as DeepLResponse;
    if (!response.ok) {
      const note = `DeepL ${response.status}: ${data.message ?? 'request failed'}`;
      if (response.status === 456 || response.status === 429 || response.status === 403) {
        return { ok: false, kind: 'exhausted', note };
      }
      if (response.status === 401) return { ok: false, kind: 'invalid', note };
      return { ok: false, kind: 'failed', note };
    }

    const translated = data.translations?.[0]?.text?.trim();
    return translated ? { ok: true, text: translated } : { ok: false, kind: 'failed', note: 'пустой ответ' };
  } catch (error) {
    return { ok: false, kind: 'failed', note: error instanceof Error ? error.message : 'ошибка сети' };
  } finally {
    clear();
  }
}

/**
 * Переводит текст через DeepL. Возвращает null, если язык не поддерживается,
 * ключей нет или все ключи ответили ошибкой — тогда работает следующий провайдер.
 */
export async function translateWithDeepL(
  env: Env,
  text: string,
  sourceLang: SourceLanguage,
  targetLang: LanguageCode,
  signal: AbortSignal,
): Promise<string | null> {
  const target = deeplLanguage(targetLang, 'target');
  const source = sourceLang === 'auto' ? null : deeplLanguage(sourceLang, 'source');
  if (!target) return null;

  const keys = await usableKeys(env, 'deepl');
  if (keys.length === 0) return null;

  const body = new URLSearchParams();
  body.set('text', text);
  body.set('target_lang', target);
  if (source) body.set('source_lang', source);

  for (const key of keys) {
    const result = await callDeepL(key, body, signal);
    if (result.ok) {
      void markUsed(env, 'deepl', key.id);
      return result.text;
    }
    console.warn(result.note);
    if (result.kind === 'exhausted') await markExhausted(env, 'deepl', key.id, result.note);
    else if (result.kind === 'invalid') await markInvalid(env, 'deepl', key.id, result.note);
  }
  return null;
}
