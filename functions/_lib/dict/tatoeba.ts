/**
 * Tatoeba API v1 (не нужен ключ): настоящие примеры предложений с переводом от людей.
 * Лицензия CC BY 2.0 FR — у каждого примера подпись «Tatoeba» и ссылка на предложение.
 * Параметры запроса (по https://api.tatoeba.org/openapi.json):
 *   lang — язык предложения (ISO 639-3), q — искомое слово, sort — обязательный параметр
 *   (relevance — по релевантности), trans:lang — язык перевода, limit — сколько вернуть.
 */
import type { DictExample, LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import { WIKT_CODES, dictFetch, readJson } from './http';

interface TatoebaTranslation {
  id?: number;
  text?: string;
  lang?: string;
  is_direct?: boolean;
  is_unapproved?: boolean;
}

interface TatoebaSentence {
  id?: number;
  text?: string;
  lang?: string;
  is_unapproved?: boolean;
  translations?: TatoebaTranslation[];
}

interface TatoebaResponse {
  data?: TatoebaSentence[];
}

/** Сколько предложений просим: часть отсеем по длине, часть — без перевода. */
const LIMIT = 12;
const MAX_LENGTH = 160;

/** Слово в предложении должно стоять отдельно (для «Haus» не подходит «Hausarzt»). */
function containsWord(sentence: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{M}])${escaped}([^\\p{L}\\p{M}]|$)`, 'iu').test(sentence);
}

/** Примеры Tatoeba с переводом на targetLang (null — сервис не ответил). */
export async function lookupExamples(
  word: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<DictExample[] | null> {
  if (sourceLang === targetLang) return null;

  const url = new URL(DICT.tatoebaApi);
  url.searchParams.set('lang', WIKT_CODES[sourceLang].iso3);
  url.searchParams.set('q', word);
  url.searchParams.set('sort', 'relevance');
  url.searchParams.set('trans:lang', WIKT_CODES[targetLang].iso3);
  url.searchParams.set('limit', String(LIMIT));

  const data = await readJson<TatoebaResponse>(await dictFetch(url.toString(), signal));
  if (!data || !Array.isArray(data.data)) return null;

  const examples: DictExample[] = [];
  const seen = new Set<string>();
  for (const sentence of data.data) {
    const text = (sentence.text ?? '').trim();
    if (!text || text.length > MAX_LENGTH || sentence.is_unapproved || typeof sentence.id !== 'number') continue;
    if (!containsWord(text, word)) continue;

    // Перевод: сначала прямой, затем любой, только проверенный.
    const translations = (sentence.translations ?? []).filter(
      (item) => item.text && item.lang === WIKT_CODES[targetLang].iso3 && !item.is_unapproved,
    );
    const translation = translations.find((item) => item.is_direct) ?? translations[0];
    if (!translation?.text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    examples.push({
      text,
      translation: translation.text.trim(),
      translationLang: targetLang,
      source: 'tatoeba',
      url: `${DICT.tatoebaPage}/${sentence.id}`,
    });
    if (examples.length >= DICT.maxExamples) break;
  }

  return examples;
}
