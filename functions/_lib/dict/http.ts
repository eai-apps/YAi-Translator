/**
 * Общие мелочи для словарных источников: запрос с таймаутом и подписью,
 * чистка HTML и список кодов Wiktionary для 12 языков продукта.
 */
import type { LanguageCode, PartOfSpeech } from '../../../shared/types';
import { DICT } from '../config';
import { withTimeoutSignal } from '../utils';

/** Запрос с User-Agent (OpenThesaurus требует контакт в каждом запросе) и таймаутом 6 секунд. */
export async function dictFetch(
  url: string,
  signal: AbortSignal | undefined,
  headers: Record<string, string> = {},
): Promise<Response | null> {
  const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, DICT.timeoutMs);
  try {
    return await fetch(url, {
      signal: timeoutSignal,
      headers: { 'User-Agent': DICT.userAgent, Accept: 'application/json', ...headers },
    });
  } catch {
    // Сеть или таймаут — источник просто пропускаем.
    return null;
  } finally {
    clear();
  }
}

/** JSON-ответ или null, если формат не совпал с документацией. */
export async function readJson<T>(response: Response | null): Promise<T | null> {
  if (!response || !response.ok) return null;
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

/** HTML → простой текст: убираем теги и лишние пробелы. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Делает первую букву заглавной: «noun» → «Noun». */
export function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Коды Wiktionary для языков продукта.
 * `rest` — префикс ключа в ответе en.wiktionary REST (язык раздела определения),
 * `html` — префикс языка в карточке de.wiktionary (для немецкого) и Tatoeba (ISO 639-3).
 */
export const WIKT_CODES: Record<LanguageCode, { rest: string; iso3: string }> = {
  de: { rest: 'de', iso3: 'deu' },
  ru: { rest: 'ru', iso3: 'rus' },
  uk: { rest: 'uk', iso3: 'ukr' },
  en: { rest: 'en', iso3: 'eng' },
  fr: { rest: 'fr', iso3: 'fra' },
  es: { rest: 'es', iso3: 'spa' },
  it: { rest: 'it', iso3: 'ita' },
  pt: { rest: 'pt', iso3: 'por' },
  pl: { rest: 'pl', iso3: 'pol' },
  nl: { rest: 'nl', iso3: 'nld' },
  tr: { rest: 'tr', iso3: 'tur' },
  ar: { rest: 'ar', iso3: 'ara' },
};

/** Части речи Wiktionary (английские названия) → части речи карточки. */
export function partOfSpeechFromWikt(value: string): PartOfSpeech {
  const text = value.toLowerCase();
  if (text.includes('noun') || text.includes('proper noun')) return 'noun';
  if (text.includes('verb')) return 'verb';
  if (text.includes('adj')) return 'adjective';
  if (text.includes('adv')) return 'adverb';
  if (text.includes('pron')) return 'pronoun';
  if (text.includes('prep') || text.includes('postp')) return 'preposition';
  if (text.includes('conj')) return 'conjunction';
  if (text.includes('num')) return 'numeral';
  if (text.includes('interj') || text.includes('particle')) return 'interjection';
  if (text.includes('phrase') || text.includes('proverb') || text.includes('prep_phrase') || text.includes('idiom'))
    return 'phrase';
  return 'other';
}
