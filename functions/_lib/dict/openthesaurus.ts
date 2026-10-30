/**
 * OpenThesaurus (не нужен ключ): немецкие синонимы и близкие слова.
 * Требования сервиса: контакт в User-Agent (см. DICT.userAgent) и не больше 60 запросов в минуту.
 * Поэтому ответ кэшируется в D1 на 30 дней вместе с карточкой; чаще одного раза на слово мы не спрашиваем.
 * Подпись-ссылка на www.openthesaurus.de обязательна на странице «О приложении».
 */
import type { LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import { dictFetch, readJson } from './http';

interface ThesaurusTerm {
  term?: string;
  level?: string;
}

interface ThesaurusSynset {
  id?: number;
  terms?: ThesaurusTerm[];
}

interface ThesaurusResponse {
  synsets?: ThesaurusSynset[];
}

/**
 * Синонимы для немецкого слова; null — сервис не ответил или слова нет.
 * Сначала берём синонимы из того набора, где есть само слово (синонимы к нему),
 * затем добавляем близкие слова из следующих наборов.
 */
export async function lookupSynonyms(
  word: string,
  sourceLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<string[] | null> {
  if (sourceLang !== 'de') return null;
  const url = new URL(DICT.openThesaurusApi);
  url.searchParams.set('q', word);
  url.searchParams.set('format', 'application/json');

  const data = await readJson<ThesaurusResponse>(await dictFetch(url.toString(), signal));
  if (!data || !Array.isArray(data.synsets)) return null;

  const normalized = word.trim().toLowerCase();
  const termName = (term: ThesaurusTerm): string => (term.term ?? '').trim();
  const isWordForms = (term: string): boolean => /\.\.\.$/.test(term) || /^\(/.test(term);

  // Наборы, где есть само слово, — это «его» синонимы.
  const own = data.synsets.filter((synset) =>
    (synset.terms ?? []).some((term) => termName(term).toLowerCase() === normalized),
  );
  const ordered = [...own, ...data.synsets.filter((synset) => !own.includes(synset))];

  const result: string[] = [];
  const seen = new Set<string>([normalized]);
  for (const synset of ordered) {
    if (result.length >= DICT.maxSynonyms) break;
    for (const term of synset.terms ?? []) {
      const name = termName(term);
      const lower = name.toLowerCase();
      if (!name || seen.has(lower) || isWordForms(name) || name.length > 40) continue;
      seen.add(lower);
      result.push(name);
      if (result.length >= DICT.maxSynonyms) break;
    }
  }

  return result.length > 0 ? result : null;
}
