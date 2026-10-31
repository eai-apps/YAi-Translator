/**
 * Подсказки при наборе одного слова (этап 8): Wiktionary opensearch.
 * Ответ кэшируется в D1 на 30 дней, поэтому одно и то же начало слова стоит одного запроса на всех.
 */
import type { LanguageCode } from '../../../shared/types';
import { SUGGEST } from '../config';
import type { Env } from '../env';
import { readCache, writeCache } from '../cache';

/** Адрес opensearch для языка: de.wiktionary.org, ru.wiktionary.org и т. д. */
function openSearchUrl(lang: LanguageCode, query: string): string {
  const host = `https://${lang}.wiktionary.org`;
  return `${host}/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${SUGGEST.limit}&namespace=0&format=json`;
}

/** Ответ opensearch: [запрос, [слова], [описания], [ссылки]]. */
export function parseOpenSearch(raw: unknown): string[] {
  if (!Array.isArray(raw) || !Array.isArray(raw[1])) return [];
  return raw[1].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

/** Слова, которые начинаются с запроса (без учёта регистра), — остальное не подсказка. */
export function filterSuggestions(words: string[], query: string): string[] {
  const prefix = query.trim().toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const word of words) {
    const text = word.trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key) || !key.startsWith(prefix)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= SUGGEST.maxItems) break;
  }
  return result;
}

/** Запрос к Wiktionary с таймаутом; ошибка сети — просто пустой список. */
async function fetchOpenSearch(lang: LanguageCode, query: string): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUGGEST.timeoutMs);
  try {
    const response = await fetch(openSearchUrl(lang, query), {
      signal: controller.signal,
      headers: { 'User-Agent': SUGGEST.userAgent, Accept: 'application/json' },
    });
    if (!response.ok) return [];
    return parseOpenSearch(await response.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Подсказки из словаря: сначала кэш D1, иначе Wiktionary (и сразу в кэш). */
export async function lookupSuggestions(env: Env, lang: LanguageCode, query: string): Promise<string[]> {
  const normalized = query.trim().toLowerCase();
  const cacheKey = `suggest:${lang}:${normalized}`;
  const cached = await readCache<{ items: string[] }>(env, cacheKey);
  if (cached && Array.isArray(cached.items)) return cached.items;

  const words = await fetchOpenSearch(lang, normalized);
  const items = filterSuggestions(words, normalized);
  // Пустой ответ тоже кэшируем: неизвестное слово не должно дёргать Wiktionary снова и снова.
  await writeCache(env, cacheKey, 'dict', { items }, SUGGEST.cacheTtlSeconds);
  return items;
}

/** Сколько слов уже есть в кэше — для кнопки «Проверить офлайн-готовность» в настройках. */
export async function countCachedSuggestions(env: Env): Promise<number> {
  if (!env.DB) return 0;
  try {
    const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM cache WHERE key LIKE 'suggest:%' AND expires_at > ?")
      .bind(Date.now())
      .first<{ total: number }>();
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

/** Сколько символов максимум принимаем в запросе (защита от длинных строк). */
export const SUGGEST_MAX_QUERY = 40;
