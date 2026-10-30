/** DeepL API Free — только обычный перевод текста, без грамматических разборов. */
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { getLanguage } from '../../../shared/languages';
import { DEEPL } from '../config';
import type { Env } from '../env';
import { withTimeoutSignal } from '../utils';

interface DeepLResponse {
  translations?: Array<{ text?: string }>;
  message?: string;
}

/**
 * Переводит текст через DeepL. Возвращает null, если язык не поддерживается,
 * ключа нет или сервис ответил ошибкой — тогда работает следующий провайдер.
 */
export async function translateWithDeepL(
  env: Env,
  text: string,
  sourceLang: SourceLanguage,
  targetLang: LanguageCode,
  signal: AbortSignal,
): Promise<string | null> {
  if (!env.DEEPL_API_KEY) return null;

  const target = getLanguage(targetLang)?.deeplCode;
  const source = sourceLang === 'auto' ? null : getLanguage(sourceLang)?.deeplCode;
  if (!target) return null;

  const body = new URLSearchParams();
  body.set('text', text);
  body.set('target_lang', target);
  if (source) body.set('source_lang', source.split('-')[0]);

  const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, DEEPL.timeoutMs);
  try {
    const response = await fetch(DEEPL.url, {
      method: 'POST',
      // С ноября 2025 DeepL принимает ключ только в заголовке Authorization.
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
      },
      body: body.toString(),
      signal: timeoutSignal,
    });

    const data = (await response.json().catch(() => ({}))) as DeepLResponse;
    if (!response.ok) {
      console.warn(`DeepL ${response.status}: ${data.message ?? 'request failed'}`);
      return null;
    }

    const translated = data.translations?.[0]?.text?.trim();
    return translated || null;
  } catch (error) {
    console.warn('DeepL недоступен:', error instanceof Error ? error.message : error);
    return null;
  } finally {
    clear();
  }
}
