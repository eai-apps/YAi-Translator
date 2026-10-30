/**
 * Проверка обычных переводчиков без ИИ: DeepL, Microsoft, Google, MyMemory, M2M100.
 * Проверяем сам ответ сервиса, а не текст перевода: у MyMemory для коротких слов
 * перевод бывает пустым, и это не поломка. Для DeepL хватает запроса расхода.
 */
import type { ServiceCheck, UiLanguage } from '../../../shared/types';
import { CLASSIC, HEALTH_CHECK } from '../config';
import type { Env } from '../env';
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

export function checkDeepL(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  if (!env.DEEPL_API_KEY) return Promise.resolve(messages.notConfigured(uiLang));
  return probe('DeepL', uiLang, async (signal) => {
    const response = await fetch('https://api-free.deepl.com/v2/usage', {
      headers: { Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}` },
      signal,
    });
    return response.ok;
  });
}

export function checkMicrosoft(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  if (!env.MICROSOFT_TRANSLATOR_KEY) return Promise.resolve(messages.notConfigured(uiLang));
  return probe('Microsoft Translator', uiLang, async (signal) => {
    const url = new URL(CLASSIC.microsoftUrl);
    url.searchParams.set('api-version', '3.0');
    url.searchParams.set('to', 'ru');
    url.searchParams.set('from', 'de');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': env.MICROSOFT_TRANSLATOR_KEY ?? '',
    };
    if (env.MICROSOFT_TRANSLATOR_REGION) {
      headers['Ocp-Apim-Subscription-Region'] = env.MICROSOFT_TRANSLATOR_REGION;
    }
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify([{ Text: HEALTH_CHECK.sampleText }]),
      signal,
    });
    return response.ok;
  });
}

export function checkGoogle(env: Env, uiLang: UiLanguage): Promise<ServiceCheck> {
  if (!env.GOOGLE_TRANSLATE_KEY) return Promise.resolve(messages.notConfigured(uiLang));
  return probe('Google Translate', uiLang, async (signal) => {
    const response = await fetch(CLASSIC.googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GOOGLE_TRANSLATE_KEY ?? '',
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
