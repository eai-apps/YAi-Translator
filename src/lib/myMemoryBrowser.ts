/**
 * MyMemory прямо из браузера пользователя.
 * Сервер на Cloudflare делит лимит MyMemory с тысячами чужих сайтов (лимит считается по IP),
 * а из браузера у каждого человека свой лимит — 5 000 символов в день.
 * Используется, когда сервер вернул для MyMemory пустой ответ.
 */
import type { LanguageCode } from '../../shared/types';

const URL_BASE = 'https://api.mymemory.translated.net/get';
/** MyMemory принимает до 500 байт за запрос — длинный текст из браузера не отправляем. */
const MAX_BYTES = 480;

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  quotaFinished?: boolean;
}

export async function translateWithMyMemoryInBrowser(
  text: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  signal?: AbortSignal,
): Promise<string | null> {
  const value = text.trim();
  if (!value || sourceLang === targetLang) return null;
  if (new TextEncoder().encode(value).length > MAX_BYTES) return null;

  const url = new URL(URL_BASE);
  url.searchParams.set('q', value);
  url.searchParams.set('langpair', `${sourceLang}|${targetLang}`);
  try {
    const response = await fetch(url.toString(), { signal });
    if (!response.ok) return null;
    const data = (await response.json()) as MyMemoryResponse;
    const translated = data.responseData?.translatedText?.trim();
    if (data.quotaFinished || String(data.responseStatus) !== '200' || !translated) return null;
    if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) return null;
    return translated;
  } catch {
    // Нет сети, блокировка браузером (CORS) или отмена — просто нет варианта MyMemory.
    return null;
  }
}
